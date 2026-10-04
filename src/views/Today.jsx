import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { CheckCircle2, XCircle, MinusCircle, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import useStore from '../store';

export default function TodayView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const isCurrentToday = dateStr >= todayString;
  const isSun = currentDate.getDay() === 0;
  
  const record = useStore(state => state.records[dateStr]) || {
    breakfast_status: 'not_applicable',
    lunch_status: 'not_applicable',
    arrival_time: '',
    late: false,
    notes: '',
    approved_leave: false,
    sunday_compensation: false,
    comp_waived: false,
  };
  
  const saveRecord = useStore(state => state.saveRecord);

  const settings = useStore(state => state.settings);
  /* c8 ignore next 4 */
  const activeShifts = (settings.shifts || [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true },
    { id: 'lunch', label: 'Lunch', icon: '🍛', enabled: true },
    { id: 'dinner', label: 'Dinner', icon: '🍲', enabled: false }
  ]).filter(s => s.enabled);

  const [formData, setFormData] = useState(record);
  
  // Keep local state in sync if store changes
  useEffect(() => {
    setFormData(record);
  }, [dateStr]); // Only on mount/date change

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    saveRecord(dateStr, newData);
  };

  const getDayStatusBadge = () => {
    if (!record.day_status) return null;
    const map = {
      'full_day': { label: 'Full Day', class: 'badge-success' },
      'partial': { label: 'Partial Day', class: 'badge-warning' },
      'breakfast_only': { label: 'Partial Day', class: 'badge-warning' },
      'lunch_only': { label: 'Partial Day', class: 'badge-warning' },
      'absent': { label: 'Absent', class: 'badge-danger' },
      'holiday': { label: 'Holiday', class: 'badge-neutral' },
      'sunday_holiday': { label: 'Sunday Holiday', class: 'badge-neutral' },
      'sunday_compensation': { label: 'Compensation', class: 'badge-success' },
      'approved_leave': { label: 'Holiday', class: 'badge-neutral' },
    };
    /* c8 ignore next */
    const mapped = map[record.day_status] || { label: record.day_status, class: 'badge-neutral' };
    return <span className={`badge ${mapped.class}`}>{mapped.label}</span>;
  };

  return (
    <div className="view-today">
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}><ChevronLeft size={20}/></button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <h1 className="title" style={{ marginBottom: 0, textAlign: 'center' }}>
                {format(currentDate, 'EEEE, MMM do')}
              </h1>
              <input 
                type="date"
                value={dateStr}
                max={todayString}
                onChange={(e) => {
                  if (e.target.value && e.target.value <= todayString) {
                    // Adding T00:00:00 ensures it parses in local time rather than UTC
                    setCurrentDate(new Date(e.target.value + 'T00:00:00'));
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
            <p className="subtitle" style={{ fontWeight: 400, marginTop: '4px' }}>Daily Attendance</p>
          </div>
          <button 
            className="btn-icon" 
            disabled={isCurrentToday}
            style={{ opacity: isCurrentToday ? 0.3 : 1 }}
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
          >
            <ChevronRight size={20}/>
          </button>
        </div>
        {getDayStatusBadge()}
      </div>

      {activeShifts.map(shift => {
        const status = formData[`${shift.id}_status`];
        return (
          <div className="card" key={shift.id}>
            <div className="subtitle">{shift.icon} {shift.label}</div>
            <div className="status-grid">
              <button 
                className={`status-btn ${status === 'completed' ? 'active-completed' : ''}`}
                onClick={() => handleChange(`${shift.id}_status`, 'completed')}
              >
                <CheckCircle2 size={20} />
                Completed
              </button>
              <button 
                className={`status-btn ${status === 'missed' ? 'active-missed' : ''}`}
                onClick={() => handleChange(`${shift.id}_status`, 'missed')}
              >
                <XCircle size={20} />
                Missed
              </button>
              <button 
                className={`status-btn ${status === 'not_applicable' ? 'active-na' : ''}`}
                onClick={() => handleChange(`${shift.id}_status`, 'not_applicable')}
              >
                <MinusCircle size={20} />
                N/A
              </button>
            </div>
          </div>
        )
      })}

      <div className="card">
        <div className="form-group">
          <label className="form-label flex-row gap-2"><Clock size={16} /> Arrival Time</label>
          <input 
            type="time" 
            className="form-input" 
            value={formData.arrival_time || ''}
            onChange={(e) => handleChange('arrival_time', e.target.value)}
          />
        </div>
        
        <div className="flex-row gap-2" style={{ marginBottom: '16px' }}>
          <input 
            type="checkbox" 
            id="late-checkbox"
            checked={formData.late || false}
            onChange={(e) => handleChange('late', e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <label htmlFor="late-checkbox" className="form-label" style={{ margin: 0 }}>Arrived Late</label>
        </div>

        {isSun && (
          <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <div className="flex-row gap-2" style={{ marginBottom: '12px' }}>
              <input 
                type="checkbox" 
                id="sunday-comp"
                checked={formData.sunday_compensation || false}
                onChange={(e) => handleChange('sunday_compensation', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="sunday-comp" className="form-label" style={{ margin: 0, color: 'var(--success)' }}>Completed Compensation (Worked)</label>
            </div>
            <div className="flex-row gap-2">
              <input 
                type="checkbox" 
                id="comp-waived"
                checked={formData.comp_waived || false}
                onChange={(e) => handleChange('comp_waived', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="comp-waived" className="form-label" style={{ margin: 0, color: 'var(--warning)' }}>Waive Pending Compensation</label>
            </div>
          </div>
        )}

        <div className="flex-row gap-2" style={{ marginBottom: (formData.approved_leave && !formData.notes?.trim()) ? '4px' : '16px' }}>
          <input 
            type="checkbox" 
            id="approved-leave"
            checked={formData.approved_leave || false}
            onChange={(e) => handleChange('approved_leave', e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <label htmlFor="approved-leave" className="form-label" style={{ margin: 0, color: 'var(--danger)' }}>Mark as Holiday</label>
        </div>
        {formData.approved_leave && !formData.notes?.trim() && (
          <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '12px', fontWeight: 600 }}>
            * A reason must be provided below to mark as Holiday.
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label flex-row gap-2"><FileText size={16} /> Notes / Reason</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Reason for absence or late..."
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Status is saved automatically.
      </div>
    </div>
  );
}
