import { describe, it, expect, beforeEach } from 'vitest';
import useStore from './store.js';

describe('Store Logic (Zustand)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      settings: {
        workingDays: [1, 2, 3, 4, 5, 6],
        expectedBreakfastTime: '08:30',
        expectedLunchTime: '13:00',
        sundayHoliday: true,
        sundayCompensation: true,
        googleSheetWebhookUrl: '',
        shifts: [
          { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true },
          { id: 'lunch', label: 'Lunch', icon: '🍛', enabled: true },
          { id: 'dinner', label: 'Dinner', icon: '🍲', enabled: false }
        ]
      },
      records: {}
    });
  });

  it('calculates full_day status when all active shifts are completed', () => {
    const { saveRecord } = useStore.getState();
    const dateStr = '2026-10-05'; // Monday

    saveRecord(dateStr, {
      breakfast_status: 'completed',
      lunch_status: 'completed',
      arrival_time: '08:00'
    });

    const record = useStore.getState().records[dateStr];
    expect(record.day_status).toBe('full_day');
    expect(record.late).toBe(false);
  });

  it('calculates partial status when some shifts are missed', () => {
    const { saveRecord } = useStore.getState();
    const dateStr = '2026-10-05';

    saveRecord(dateStr, {
      breakfast_status: 'completed',
      lunch_status: 'missed',
      arrival_time: '08:00'
    });

    const record = useStore.getState().records[dateStr];
    expect(record.day_status).toBe('partial');
  });

  it('calculates absent status when all shifts are missed', () => {
    const { saveRecord } = useStore.getState();
    const dateStr = '2026-10-05';

    saveRecord(dateStr, {
      breakfast_status: 'missed',
      lunch_status: 'missed',
      arrival_time: ''
    });

    const record = useStore.getState().records[dateStr];
    expect(record.day_status).toBe('absent');
  });

  it('marks as late if arrival time is after expected time', () => {
    const { saveRecord } = useStore.getState();
    const dateStr = '2026-10-05';

    saveRecord(dateStr, {
      breakfast_status: 'completed',
      lunch_status: 'completed',
      arrival_time: '09:00' // Expected is 08:30
    });

    const record = useStore.getState().records[dateStr];
    expect(record.late).toBe(true);
  });

  it('respects dynamic shifts (only dinner enabled)', () => {
    const { saveRecord, updateSettings } = useStore.getState();
    
    updateSettings({
      shifts: [
        { id: 'breakfast', enabled: false },
        { id: 'lunch', enabled: false },
        { id: 'dinner', enabled: true }
      ]
    });

    const dateStr = '2026-10-05';
    saveRecord(dateStr, {
      dinner_status: 'completed',
      arrival_time: '18:00'
    });

    const record = useStore.getState().records[dateStr];
    expect(record.day_status).toBe('full_day'); // Only 1 active shift, and it was completed
  });
  
  it('imports records correctly', () => {
    const { importRecords } = useStore.getState();
    const mockData = [
      {
        date: '2026-10-01',
        arrival_time: '08:00',
        late: false,
        day_status: 'full_day',
        breakfast_status: 'completed',
        lunch_status: 'completed'
      }
    ];

    importRecords(mockData);

    const record = useStore.getState().records['2026-10-01'];
    expect(record).toBeDefined();
    expect(record.day_status).toBe('full_day');
    expect(record.breakfast_status).toBe('completed');
  });
});
