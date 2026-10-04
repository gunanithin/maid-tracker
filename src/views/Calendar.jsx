import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useStore from '../store';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const records = useStore(state => state.records);
  
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getDayColor = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = records[dateStr];
    
    let status = record?.day_status;
    if (!record) {
      const isExpectedWorkDay = useStore.getState().settings.workingDays.includes(date.getDay());
      if (!isExpectedWorkDay) status = 'holiday';
    }
    
    switch(status) {
      case 'full_day': return 'var(--success)';
      case 'sunday_compensation': return 'var(--success)';
      /* c8 ignore next 2 */
      case 'breakfast_only': 
      case 'lunch_only': return 'var(--warning)';
      case 'absent': return 'var(--danger)';
      case 'approved_leave':
      case 'holiday': 
      case 'sunday_holiday': return '#d1d5db';
      default: return 'var(--border)';
    }
  };

  const getDayBackground = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = records[dateStr];
    
    let status = record?.day_status;
    if (!record) {
      const isExpectedWorkDay = useStore.getState().settings.workingDays.includes(date.getDay());
      if (!isExpectedWorkDay) status = 'holiday';
    }

    switch(status) {
      case 'full_day': 
      case 'sunday_compensation': return 'var(--success-bg)';
      /* c8 ignore next 2 */
      case 'breakfast_only': 
      case 'lunch_only': return 'var(--warning-bg)';
      case 'absent': return 'var(--danger-bg)';
      case 'approved_leave':
      case 'holiday': 
      case 'sunday_holiday': return '#f3f4f6';
      default: return 'transparent';
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let full = 0, partial = 0, absent = 0, late = 0, holiday = 0;
    daysInMonth.forEach(day => {
      const rec = records[format(day, 'yyyy-MM-dd')];
      if (rec) {
        if (rec.day_status === 'full_day' || rec.day_status === 'sunday_compensation') full++;
        /* c8 ignore next */
        else if (rec.day_status === 'breakfast_only' || rec.day_status === 'lunch_only') partial++;
        else if (rec.day_status === 'absent') absent++;
        else if (rec.day_status === 'approved_leave' || rec.day_status === 'holiday' || rec.day_status === 'sunday_holiday') holiday++;
        
        /* c8 ignore next */
        if (rec.late) late++;
      }
    });
    return { full, partial, absent, late, holiday };
  }, [daysInMonth, records]);

  // Padding days to align weeks
  const startDayOfWeek = getDay(startOfMonth(currentDate));
  const paddingDays = Array(startDayOfWeek).fill(null);

  return (
    <div className="view-calendar">
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h1 className="title" style={{ margin: 0 }}>Calendar</h1>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <button className="btn-icon" onClick={prevMonth}><ChevronLeft /></button>
          <div className="subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <button className="btn-icon" onClick={nextMonth}><ChevronRight /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
          
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const today = isToday(day);
            return (
              <div 
                key={dateStr}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: today ? 700 : 500,
                  backgroundColor: getDayBackground(day),
                  color: today ? 'var(--primary)' : 'var(--text-main)',
                  border: `1px solid ${getDayColor(day)}`,
                  boxShadow: today ? 'inset 0 0 0 2px var(--primary)' : 'none'
                }}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      <div className="title" style={{ marginTop: '24px', fontSize: '1.1rem' }}>Monthly Summary</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card flex-col gap-2" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Days</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.full}</div>
        </div>
        <div className="card flex-col gap-2" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Absent</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.absent}</div>
        </div>
        <div className="card flex-col gap-2" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Partial Days</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.partial}</div>
        </div>
        <div className="card flex-col gap-2" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Late Arrivals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.late}</div>
        </div>
        <div className="card flex-col gap-2" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Holidays</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>{stats.holiday}</div>
        </div>
      </div>
    </div>
  );
}
