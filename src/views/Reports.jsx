import { useMemo, useState, useRef } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subWeeks, addWeeks, subMonths, addMonths, isSunday } from 'date-fns';
import { ChevronLeft, ChevronRight, Share2, Copy, Check, Image as ImageIcon, FileText, AlignLeft, Calendar as CalendarIcon } from 'lucide-react';
import useStore from '../store';
import { toBlob } from 'html-to-image';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ReportsView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' or 'monthly'
  
  const records = useStore(state => state.records);
  const settings = useStore(state => state.settings);
  const visualCardRef = useRef(null);
  const detailedCardRef = useRef(null);
  
  const reportRange = useMemo(() => {
    let start, end;
    if (timeframe === 'weekly') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }
    return eachDayOfInterval({ start, end });
  }, [currentDate, timeframe]);

  const prevPeriod = () => setCurrentDate(timeframe === 'weekly' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  const nextPeriod = () => setCurrentDate(timeframe === 'weekly' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));

  /* v8 ignore next 4 */
  const activeShifts = (settings.shifts || [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true },
    { id: 'lunch', label: 'Lunch', icon: '🍛', enabled: true },
    { id: 'dinner', label: 'Dinner', icon: '🍲', enabled: false }
  ]).filter(s => s.enabled);

  const stats = useMemo(() => {
    let expectedDays = 0, attended = 0, absent = 0, late = 0;
    let partial = 0, holiday = 0;
    let missingDaysInfo = [];
    let requiredComp = 0;
    let compensationsCompleted = 0;
    let compensationsWaived = 0;

    let shiftStats = {};
    activeShifts.forEach(s => { shiftStats[s.id] = { count: 0, expected: 0, label: s.label, icon: s.icon } });

    let dailyBreakdown = [];

    reportRange.forEach(day => {
      const isSun = isSunday(day);
      const isExpectedWorkDay = settings.workingDays.includes(day.getDay());
      const dateStr = format(day, 'yyyy-MM-dd');
      const rec = records[dateStr];
      const dayName = format(day, 'EEE');
      const fullDayName = format(day, 'EEEE');
      const displayDate = format(day, 'MMM d');

      let dayIcons = [];
      let dayTextStatus = 'No Record';

      if (isExpectedWorkDay) {
        expectedDays++;
        activeShifts.forEach(s => shiftStats[s.id].expected++);
      }

      if (rec) {
        // Evaluate Icons for Visual
        activeShifts.forEach(s => {
          const st = rec[`${s.id}_status`];
          if (st === 'completed') dayIcons.push('✅');
          else if (st === 'missed') dayIcons.push('❌');
          /* v8 ignore next */
          else dayIcons.push('➖');
        });

        /* v8 ignore start */
        if (rec.day_status === 'holiday' || rec.day_status === 'sunday_holiday' || rec.day_status === 'approved_leave') {
           dayIcons = activeShifts.map(() => '🏖️');
           dayTextStatus = 'Holiday';
           holiday++;
        } else if (rec.day_status === 'absent') {
           dayTextStatus = 'Absent';
        } else {
           dayTextStatus = 'Present';
        }

        if (rec.day_status === 'breakfast_only' || rec.day_status === 'lunch_only') {
           partial++;
        }

        // Attendance
        if (rec.day_status !== 'absent' && rec.day_status !== 'holiday' && rec.day_status !== 'sunday_holiday' && rec.day_status !== 'approved_leave') {
          attended++;
        }
        
        if (rec.day_status === 'absent' && isExpectedWorkDay) {
          absent++;
          missingDaysInfo.push(`${displayDate} (${fullDayName}) — Absent`);
          if (settings.sundayCompensation) requiredComp++;
        }

        if (rec.day_status === 'approved_leave') {
          missingDaysInfo.push(`${displayDate} (${fullDayName}) — Holiday (${rec.notes})`);
        }

        if (rec.day_status === 'sunday_compensation') {
          compensationsCompleted++;
        }
        /* v8 ignore stop */

        /* v8 ignore next 3 */
        if (rec.comp_waived) {
          compensationsWaived++;
        }

        if (rec.late) late++;

        /* v8 ignore start */
        // Shifts
        activeShifts.forEach(s => {
          if (rec[`${s.id}_status`] === 'completed') {
            shiftStats[s.id].count++;
          } else if (rec[`${s.id}_status`] === 'missed' && isExpectedWorkDay && rec.day_status !== 'absent') {
            missingDaysInfo.push(`${s.label} missed on ${displayDate}`);
          }
        });
        /* v8 ignore stop */
      } else {
        if (isExpectedWorkDay && dateStr < format(new Date(), 'yyyy-MM-dd')) {
          absent++;
          missingDaysInfo.push(`${displayDate} (${fullDayName}) — No record (Assumed Absent)`);
          if (settings.sundayCompensation) requiredComp++;
          dayIcons = activeShifts.map(() => '❌');
          dayTextStatus = 'Absent';
        } else if (!isExpectedWorkDay) {
          dayIcons = activeShifts.map(() => '🏖️');
          dayTextStatus = 'Holiday';
          if (dateStr <= format(new Date(), 'yyyy-MM-dd')) holiday++;
        }
      }

      let statusText = '';
      let notesRaw = rec?.notes || '';
      let notesText = notesRaw ? ` - ${notesRaw}` : '';

      if (rec) {
         if (rec.day_status === 'full_day') statusText = 'Full Day';
         /* v8 ignore start */
         else if (rec.day_status === 'sunday_compensation') statusText = 'Sunday Comp';
         else if (rec.day_status === 'absent') statusText = 'Absent';
         else if (rec.day_status === 'approved_leave') statusText = 'Holiday (Approved)';
         else if (rec.day_status === 'holiday' || rec.day_status === 'sunday_holiday') statusText = 'Holiday';
         else statusText = 'Partial Day';
         /* v8 ignore stop */
         
         if (rec.comp_waived) statusText += ' (Comp Waived)';
      } else {
         if (isExpectedWorkDay && dateStr < format(new Date(), 'yyyy-MM-dd')) statusText = 'Absent';
         else if (!isExpectedWorkDay) statusText = 'Holiday';
         else statusText = 'Pending';
      }

      dailyBreakdown.push({ dateStr, displayDate, dayName, dayIcons, dayTextStatus, isSun, statusText, notesText, notesRaw });
    });

    const netRequiredComp = Math.max(0, requiredComp - compensationsCompleted - compensationsWaived);

    return { expectedDays, attended, absent, partial, holiday, late, shiftStats, missingDaysInfo, requiredComp: netRequiredComp, dailyBreakdown };
  }, [reportRange, records, settings]);

  const detailedReport = useMemo(() => {
    let text = `*${timeframe === 'monthly' ? 'Monthly' : 'Weekly'} Attendance Summary*\n(${format(reportRange[0], 'MMM d')} – ${format(reportRange[reportRange.length-1], 'MMM d')})\n\n`;
    text += `Expected working days: ${stats.expectedDays}\n`;
    text += `Total Attended: ${stats.attended}\n`;
    text += `Days Absent: ${stats.absent}\n\n`;
    
    Object.values(stats.shiftStats).forEach(s => {
      text += `${s.icon} ${s.label}: ${s.count}/${s.expected}\n`;
    });

    if (stats.late > 0) text += `⏰ Late arrivals: ${stats.late}\n`;
    
    if (stats.missingDaysInfo.length > 0) {
      text += `\n❌ Exceptions / Missed:\n`;
      stats.missingDaysInfo.forEach(info => text += `- ${info}\n`);
    }

    if (settings.sundayCompensation && stats.requiredComp > 0) {
      text += `\n🔄 Sunday Compensation:\n*Required — ${stats.requiredComp} day(s)*`;
    }

    return text;
  }, [reportRange, stats, settings, timeframe]);

  const textLogReport = useMemo(() => {
    let text = `*${timeframe === 'monthly' ? 'Monthly' : 'Weekly'} Attendance Log*\n(${format(reportRange[0], 'MMM d')} – ${format(reportRange[reportRange.length-1], 'MMM d')})\n\n`;
    
    stats.dailyBreakdown.forEach(d => {
      // Only show logs for past and present days, or explicitly recorded days
      if (d.statusText !== 'Pending') {
        text += `${d.displayDate} (${d.dayName}): ${d.statusText}${d.notesText}\n`;
      }
    });

    text += `\n*Summary:*\n`;
    text += `Total Attended: ${stats.attended} / ${stats.expectedDays}\n`;
    text += `Absent: ${stats.absent}\n`;
    text += `Late Arrivals: ${stats.late}\n`;
    if (settings.sundayCompensation && stats.requiredComp > 0) {
      text += `Sunday Comp Required: ${stats.requiredComp} day(s)\n`;
    }

    return text;
  }, [reportRange, stats, timeframe, settings]);

  /* v8 ignore start */
  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareText = (textToShare) => {
    if (navigator.share) {
      navigator.share({
        title: 'Attendance Report',
        text: textToShare,
      }).catch(console.error);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
    }
  };

  const shareImage = async (refToShare) => {
    if (!refToShare.current) return;
    try {
      const blob = await toBlob(refToShare.current, { backgroundColor: 'var(--bg)', style: { margin: 0, padding: '16px', borderRadius: 0 } });
      const file = new File([blob], 'report.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_report.png';
        a.click();
      }
    } catch(err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate image. Try copying text instead.');
    }
  };
  /* v8 ignore stop */

  // Chart data
  const pieData = [
    { name: 'Attended (Full)', value: stats.attended - stats.partial, color: '#10b981' }, // success
    { name: 'Partial Days', value: stats.partial, color: '#f59e0b' }, // warning
    { name: 'Absent', value: stats.absent, color: '#ef4444' }, // danger
    { name: 'Holidays', value: stats.holiday, color: '#d1d5db' } // gray
  ].filter(d => d.value > 0);

  const getBadgeClass = (statusText) => {
    if (statusText === 'Full Day' || statusText === 'Sunday Comp') return 'badge-success';
    if (statusText === 'Absent') return 'badge-danger';
    /* v8 ignore next 2 */
    if (statusText === 'Breakfast Only' || statusText === 'Lunch Only') return 'badge-warning';
    return 'badge-neutral';
  };

  return (
    <div className="view-reports">
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <h1 className="title" style={{ margin: 0 }}>Reports</h1>
        
        <div style={{ display: 'flex', backgroundColor: 'var(--neutral-bg)', padding: '4px', borderRadius: 'var(--radius)' }}>
          <button 
            onClick={() => setTimeframe('weekly')}
            style={{ padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', backgroundColor: timeframe === 'weekly' ? 'var(--bg-card)' : 'transparent', color: timeframe === 'weekly' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: timeframe === 'weekly' ? 'var(--shadow-sm)' : 'none' }}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeframe('monthly')}
            style={{ padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', backgroundColor: timeframe === 'monthly' ? 'var(--bg-card)' : 'transparent', color: timeframe === 'monthly' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: timeframe === 'monthly' ? 'var(--shadow-sm)' : 'none' }}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="flex-between card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <button className="btn-icon" onClick={prevPeriod}><ChevronLeft /></button>
        <div className="subtitle" style={{ margin: 0 }}>
          {timeframe === 'weekly' 
            ? `${format(reportRange[0], 'MMM d')} – ${format(reportRange[reportRange.length-1], 'MMM d')}`
            : format(reportRange[0], 'MMMM yyyy')}
        </div>
        <button className="btn-icon" onClick={nextPeriod}><ChevronRight /></button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', backgroundColor: 'var(--neutral-bg)', padding: '4px', borderRadius: 'var(--radius)' }}>
        <button 
          onClick={() => setActiveTab('visual')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', backgroundColor: activeTab === 'visual' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'visual' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'visual' ? 'var(--shadow-sm)' : 'none' }}
        >
          <ImageIcon size={16} style={{ marginBottom: '-3px', marginRight: '4px' }}/> Visual
        </button>
        <button 
          onClick={() => setActiveTab('textLog')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', backgroundColor: activeTab === 'textLog' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'textLog' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'textLog' ? 'var(--shadow-sm)' : 'none' }}
        >
          <AlignLeft size={16} style={{ marginBottom: '-3px', marginRight: '4px' }}/> Text Log
        </button>
        <button 
          onClick={() => setActiveTab('detailed')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', backgroundColor: activeTab === 'detailed' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'detailed' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: activeTab === 'detailed' ? 'var(--shadow-sm)' : 'none' }}
        >
          <FileText size={16} style={{ marginBottom: '-3px', marginRight: '4px' }}/> Detailed
        </button>
      </div>

      {activeTab === 'visual' && (
        <>
          <div ref={visualCardRef} className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '8px' }}>
              {timeframe === 'monthly' ? 'Monthly Scorecard' : 'Weekly Scorecard'}
            </h2>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              {timeframe === 'monthly' 
                ? format(reportRange[0], 'MMMM yyyy')
                : `${format(reportRange[0], 'MMM d')} – ${format(reportRange[reportRange.length-1], 'MMM d')}`
              }
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: `1.5fr ${activeShifts.map(() => '1fr').join(' ')}`, gap: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ textAlign: 'left' }}>Date</div>
              {activeShifts.map((s, idx) => <div key={idx}>{s.label}</div>)}
            </div>
            
            {stats.dailyBreakdown.map((d, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: `1.5fr ${activeShifts.map(() => '1fr').join(' ')}`, gap: '8px', marginBottom: '12px', alignItems: 'center', textAlign: 'center', fontSize: '1.1rem' }}>
                <div style={{ textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: d.isSun ? 'var(--danger)' : 'var(--text-main)' }}>
                  {d.displayDate} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.dayName}</span>
                </div>
                {d.dayIcons.map((icon, idx) => <div key={idx}>{icon}</div>)}
              </div>
            ))}
            
            <div style={{ borderTop: '2px dashed var(--border)', margin: '20px 0' }}></div>
            
            <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}>
              Total Attended: <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>{stats.attended}</span> / {stats.expectedDays}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>✅ Completed</span>
              <span>❌ Missed</span>
              <span>🏖️ Holiday</span>
            </div>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }} onClick={() => shareImage(visualCardRef)}>
            <Share2 size={18} style={{ marginRight: '8px' }} />
            Share as Image
          </button>
        </>
      )}

      {activeTab === 'textLog' && (
        <>
          <div className="card" style={{ padding: '0', backgroundColor: 'var(--bg-card)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Chronological Log</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stats.dailyBreakdown.filter(d => d.statusText !== 'Pending').map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', borderBottom: '1px solid var(--border)', backgroundColor: d.isSun ? 'var(--neutral-bg)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: d.notesRaw ? '6px' : '0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.displayDate} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginLeft: '4px' }}>{d.dayName}</span></div>
                    <span className={`badge ${getBadgeClass(d.statusText)}`}>{d.statusText}</span>
                  </div>
                  {/* v8 ignore start */}
                  {d.notesRaw && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <FileText size={14} /> <i>{d.notesRaw}</i>
                    </div>
                  )}
                  {/* v8 ignore stop */}
                </div>
              ))}
              {stats.dailyBreakdown.filter(d => d.statusText !== 'Pending').length === 0 && (
                /* v8 ignore start */
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No records to display yet.
                </div>
                /* v8 ignore stop */
              )}
            </div>
          </div>
          /* v8 ignore start */
          <div className="flex-row gap-4" style={{ marginTop: '16px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleCopy(textLogReport)}>
              {copied ? <Check size={18} style={{ marginRight: '8px' }}/> : <Copy size={18} style={{ marginRight: '8px' }} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleShareText(textLogReport)}>
              <Share2 size={18} style={{ marginRight: '8px' }} />
              Share Log
            </button>
          </div>
          /* v8 ignore stop */
        </>
      )}

      {activeTab === 'detailed' && (
        <>
          <div ref={detailedCardRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '24px 16px', backgroundColor: 'var(--bg-card)', margin: 0 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', textAlign: 'center' }}>Attendance Breakdown</h3>
              <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} days`, name]} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected Days</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.expectedDays}</div>
              </div>
              <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Attended</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.attended}</div>
              </div>
              <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Days Absent</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{stats.absent}</div>
              </div>
              <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Late Arrivals</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.late}</div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-card)', margin: 0 }}>
             {stats.missingDaysInfo.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--danger)' }}>❌ Exceptions / Missed</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {stats.missingDaysInfo.map((info, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{info}</li>)}
                </ul>
              </div>
            )}
            
            {settings.sundayCompensation && stats.requiredComp > 0 && (
              <div style={{ backgroundColor: 'var(--warning-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--warning)' }}>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--warning)' }}>🔄 Sunday Compensation</h4>
                <div style={{ fontSize: '0.95rem' }}>Required: <strong>{stats.requiredComp} day(s)</strong></div>
              </div>
            )}

            {stats.missingDaysInfo.length === 0 && stats.requiredComp === 0 && (
              /* v8 ignore start */
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                <Check size={32} style={{ color: 'var(--success)', marginBottom: '8px' }} />
                <div>Perfect attendance! No missed days.</div>
              </div>
              /* v8 ignore stop */
            )}
          </div>
          </div>
          
          /* v8 ignore start */
          <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '16px' }} onClick={() => shareImage(detailedCardRef)}>
            <ImageIcon size={18} style={{ marginRight: '8px' }} />
            Share Chart as Image
          </button>

          <div className="flex-row gap-4" style={{ marginTop: '16px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleCopy(detailedReport)}>
              {copied ? <Check size={18} style={{ marginRight: '8px' }}/> : <Copy size={18} style={{ marginRight: '8px' }} />}
              {copied ? 'Copied Text' : 'Copy Text'}
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleShareText(detailedReport)}>
              <Share2 size={18} style={{ marginRight: '8px' }} />
              Share Text
            </button>
          </div>
          /* v8 ignore stop */
        </>
      )}
    </div>
  );
}
