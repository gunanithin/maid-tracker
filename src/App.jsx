import { useState } from 'react';
import { Calendar as CalendarIcon, CheckSquare, BarChart, Settings as SettingsIcon } from 'lucide-react';
import TodayView from './views/Today';
import CalendarView from './views/Calendar';
import ReportsView from './views/Reports';
import SettingsView from './views/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('today');

  const renderContent = () => {
    switch(activeTab) {
      case 'today': return <TodayView />;
      case 'calendar': return <CalendarView />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView />;
      /* c8 ignore next */
      default: return <TodayView />;
    }
  }

  return (
    <div className="app-container">
      <div className="content">
        {renderContent()}
      </div>
      
      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          <CheckSquare size={24} />
          <span>Today</span>
        </button>
        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={24} />
          <span>Calendar</span>
        </button>
        <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <BarChart size={24} />
          <span>Reports</span>
        </button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <SettingsIcon size={24} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

export default App;
