import { useState } from 'react';
import useStore from '../store';

export default function SettingsView() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);

  const [formData, setFormData] = useState({
    googleSheetWebhookUrl: settings.googleSheetWebhookUrl || '',
    expectedBreakfastTime: settings.expectedBreakfastTime || '',
    expectedLunchTime: settings.expectedLunchTime || '',
    workingDays: settings.workingDays || [1, 2, 3, 4, 5, 6],
    sundayHoliday: settings.sundayHoliday !== false,
    sundayCompensation: settings.sundayCompensation !== false,
    shifts: settings.shifts || [
      { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true },
      { id: 'lunch', label: 'Lunch', icon: '🍛', enabled: true },
      { id: 'dinner', label: 'Dinner', icon: '🍲', enabled: false }
    ]
  });

  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const importRecords = useStore(state => state.importRecords);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleWorkingDay = (dayIndex) => {
    setFormData(prev => {
      const days = [...prev.workingDays];
      if (days.includes(dayIndex)) {
        return { ...prev, workingDays: days.filter(d => d !== dayIndex) };
      } else {
        return { ...prev, workingDays: [...days, dayIndex].sort() };
      }
    });
  };

  const handleShiftChange = (index, field, value) => {
    const newShifts = [...formData.shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setFormData({ ...formData, shifts: newShifts });
  };

  const handleSave = () => {
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSync = async () => {
    if (!formData.googleSheetWebhookUrl) return;
    setSyncing(true);
    try {
      const response = await fetch(formData.googleSheetWebhookUrl, { method: 'GET' });
      const data = await response.json();
      if (data && data.records) {
        importRecords(data.records);
        alert(`Successfully synced ${data.records.length} records from Google Sheets!`);
      } else {
        alert('Sync successful, but no records were found.');
      }
    } catch (e) {
      console.error(e);
      alert('Sync failed. Please ensure you updated your Apps Script with the doGet function from the README.');
    }
    setSyncing(false);
  };

  const daysOfWeek = [
    { label: 'M', val: 1 }, { label: 'T', val: 2 }, { label: 'W', val: 3 },
    { label: 'T', val: 4 }, { label: 'F', val: 5 }, { label: 'S', val: 6 },
    { label: 'S', val: 0 }
  ];

  return (
    <div className="view-settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="title" style={{ margin: 0 }}>Settings</h1>
      </div>

      <div className="card">
        <div className="subtitle">Working Days</div>
        <div className="flex-row gap-2" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
          {daysOfWeek.map(day => {
            const isActive = formData.workingDays.includes(day.val);
            return (
              <button 
                key={day.val}
                onClick={() => toggleWorkingDay(day.val)}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--neutral-bg)',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="subtitle">Expected Times</div>
        <div className="form-group">
          <label className="form-label">Breakfast</label>
          <input 
            type="time" 
            className="form-input" 
            value={formData.expectedBreakfastTime}
            onChange={(e) => handleChange('expectedBreakfastTime', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Lunch</label>
          <input 
            type="time" 
            className="form-input" 
            value={formData.expectedLunchTime}
            onChange={(e) => handleChange('expectedLunchTime', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="subtitle">Rules</div>
        
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <div>
            <div className="form-label">Sunday Holiday</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Treat Sundays as holidays by default</div>
          </div>
          <input 
            type="checkbox" 
            checked={formData.sundayHoliday}
            onChange={(e) => handleChange('sundayHoliday', e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
        </div>

        <div className="flex-between">
          <div style={{ paddingRight: '16px' }}>
            <div className="form-label">Sunday Compensation</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missed Mon-Sat require working on Sun</div>
          </div>
          <input 
            type="checkbox" 
            checked={formData.sundayCompensation}
            onChange={(e) => handleChange('sundayCompensation', e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="subtitle">Data Backup</div>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Google Sheets Webhook URL</label>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Paste your Google Apps Script Web App URL here to automatically sync records.
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder="https://script.google.com/macros/s/..."
            value={formData.googleSheetWebhookUrl || ''}
            onChange={(e) => handleChange('googleSheetWebhookUrl', e.target.value)}
          />
        </div>
        
        <button 
          className="btn btn-outline" 
          style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
          onClick={handleSync}
          disabled={syncing || !formData.googleSheetWebhookUrl}
        >
          {syncing ? 'Syncing...' : '⬇️ Sync Data from Google Sheets'}
        </button>
      </div>

      <div className="card">
        <div className="subtitle">Shift Configuration</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Enable or rename the shifts you want to track (Breakfast, Lunch, Dinner).
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {formData.shifts.map((shift, idx) => (
            <div key={shift.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={shift.enabled}
                onChange={(e) => handleShiftChange(idx, 'enabled', e.target.checked)}
                style={{ width: '18px', height: '18px', flexShrink: 0 }}
              />
              <input 
                type="text" 
                className="input form-input" 
                value={shift.icon}
                onChange={(e) => handleShiftChange(idx, 'icon', e.target.value)}
                style={{ width: '50px', textAlign: 'center', padding: '8px 4px', margin: 0 }}
                title="Emoji Icon"
              />
              <input 
                type="text" 
                className="input form-input" 
                value={shift.label}
                onChange={(e) => handleShiftChange(idx, 'label', e.target.value)}
                style={{ flex: 1, margin: 0 }}
                placeholder="Shift Name"
              />
            </div>
          ))}
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
        onClick={handleSave}
      >
        {saved ? 'Settings Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
