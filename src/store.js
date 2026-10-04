import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSunday } from 'date-fns';

const useStore = create(
  persist(
    (set, get) => ({
      settings: {
        workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
        expectedBreakfastTime: '08:30',
        expectedLunchTime: '13:00',
        lateThresholdMinutes: 15, // grace period
        sundayHoliday: true,
        sundayCompensation: true, // If true, missed day in Mon-Sat requires working on Sun
        googleSheetWebhookUrl: '', // Webhook URL for Apps Script
        shifts: [
          { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true },
          { id: 'lunch', label: 'Lunch', icon: '🍛', enabled: true },
          { id: 'dinner', label: 'Dinner', icon: '🍲', enabled: false }
        ]
      },
      records: {}, // Keyed by 'YYYY-MM-DD'
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      saveRecord: (dateStr, recordData) => set((state) => {
        // Compute day_status here if not explicitly provided or to recalculate
        const { arrival_time } = recordData;
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();
        const isSun = dayOfWeek === 0;

        const activeShifts = (state.settings.shifts || [
          { id: 'breakfast', enabled: true },
          { id: 'lunch', enabled: true }
        ]).filter(s => s.enabled);

        let day_status = 'absent';
        
        let completedCount = 0;
        let missedCount = 0;
        let naCount = 0;
        
        activeShifts.forEach(shift => {
          const status = recordData[`${shift.id}_status`];
          if (status === 'completed') completedCount++;
          else if (status === 'missed') missedCount++;
          else if (status === 'not_applicable') naCount++;
        });

        if (recordData.approved_leave && (recordData.notes || '').trim() !== '') {
          day_status = 'approved_leave';
        } else if (naCount === activeShifts.length) {
          day_status = 'holiday';
        } else if (completedCount === activeShifts.length - naCount) {
          day_status = 'full_day';
        } else if (completedCount > 0 && completedCount < activeShifts.length - naCount) {
          day_status = 'partial';
        } else {
          day_status = 'absent';
        }

        if (isSun) {
          if (day_status === 'absent' && state.settings.sundayHoliday) {
            day_status = 'sunday_holiday';
          }
          if (recordData.sunday_compensation && day_status !== 'absent' && day_status !== 'holiday') {
             day_status = 'sunday_compensation'; // worked on sunday as comp
          }
        }

        // Determine late
        let late = false;
        if (arrival_time) {
          const expected = recordData.breakfast_status === 'completed' ? state.settings.expectedBreakfastTime : state.settings.expectedLunchTime;
          // Simple time string comparison "08:30" vs "08:45"
          if (arrival_time > expected) {
            late = true; // Simplified, in real life you might want to add threshold minutes
          }
        }

        const newRecord = {
          ...recordData,
          id: dateStr,
          date: dateStr,
          day_status,
          late: recordData.late !== undefined ? recordData.late : late,
          updated_at: Date.now()
        };

        // Background sync to Google Sheets
        if (state.settings.googleSheetWebhookUrl) {
          if (window.__syncTimeout) clearTimeout(window.__syncTimeout);
          
          window.__syncTimeout = setTimeout(() => {
            // Fire and forget POST request
            fetch(state.settings.googleSheetWebhookUrl, {
              method: 'POST',
              redirect: 'follow',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8',
              },
              body: JSON.stringify(newRecord),
            }).catch(err => console.error('Error syncing to sheets:', err));
          }, 1000); // 1-second debounce
        }

        return {
          records: {
            ...state.records,
            [dateStr]: newRecord
          }
        };
      }),

      importRecords: (importedRecordsArray) => set((state) => {
        const newRecords = { ...state.records };
        importedRecordsArray.forEach(rec => {
          if (!rec.date) return;
          newRecords[rec.date] = {
             id: rec.date,
             date: rec.date,
             arrival_time: rec.arrival_time || '',
             late: rec.late || false,
             day_status: rec.day_status || '',
             breakfast_status: rec.breakfast_status || '',
             lunch_status: rec.lunch_status || '',
             dinner_status: rec.dinner_status || '',
             notes: rec.notes || '',
             comp_waived: rec.comp_waived || false,
             sunday_compensation: rec.sunday_compensation || false,
             approved_leave: rec.approved_leave || false,
             updated_at: Date.now()
          };
        });
        return { records: newRecords };
      })
    }),
    {
      name: 'maid-tracker-storage', // unique name
    }
  )
);

export default useStore;
