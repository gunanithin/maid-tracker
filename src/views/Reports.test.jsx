import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReportsView from './Reports';
import useStore from '../store';

describe('ReportsView Component', () => {
  beforeEach(() => {
    useStore.setState({
      settings: {
        workingDays: [1, 2, 3, 4, 5, 6],
        expectedBreakfastTime: '08:30',
        expectedLunchTime: '13:00',
        sundayHoliday: true,
        sundayCompensation: true,
        shifts: [
          { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true },
          { id: 'lunch', label: 'Lunch', icon: '🍛', enabled: true }
        ]
      },
      records: {
        '2026-10-15': { day_status: 'full_day', late: false, breakfast_status: 'completed', lunch_status: 'completed' },
        '2026-10-16': { day_status: 'absent', late: false, breakfast_status: 'missed', lunch_status: 'missed' }
      }
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders reports view correctly', () => {
    render(<ReportsView />);
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('switches between time ranges (Weekly/Monthly)', () => {
    render(<ReportsView />);
    
    // Switch to Monthly
    fireEvent.click(screen.getByText('Monthly'));
    expect(screen.getAllByText(/October 2026/i).length).toBeGreaterThan(0);
    
    // Switch back to Weekly
    fireEvent.click(screen.getByText('Weekly'));
    expect(screen.getAllByText(/Oct 12/i).length).toBeGreaterThan(0);
  });

  it('navigates periods back and forward', () => {
    render(<ReportsView />);
    expect(screen.getAllByText(/Oct 12/i).length).toBeGreaterThan(0);
  });

  it('toggles tabs (Visual vs Text Log vs Detailed)', () => {
    render(<ReportsView />);
    
    // Switch to Text Log tab
    fireEvent.click(screen.getByText(/Text Log/i));
    expect(screen.getAllByText(/Full Day/i).length).toBeGreaterThan(0);
    
    // Switch to Detailed tab
    fireEvent.click(screen.getByText(/Detailed/i));
    expect(screen.getAllByText(/Total Attended/i).length).toBeGreaterThan(0);
    
    // Switch back to Visual
    fireEvent.click(screen.getByText(/Visual/i));
  });
  
  it('renders scorecard summary', () => {
    render(<ReportsView />);
    expect(screen.getAllByText(/Weekly Scorecard/i).length).toBeGreaterThan(0);
  });
});
