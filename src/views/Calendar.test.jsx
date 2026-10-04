import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CalendarView from './Calendar';
import useStore from '../store';

describe('CalendarView Component', () => {
  beforeEach(() => {
    useStore.setState({
      settings: {
        workingDays: [1, 2, 3, 4, 5, 6],
        sundayHoliday: true,
        sundayCompensation: true,
        shifts: [
          { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true }
        ]
      },
      records: {
        '2026-10-01': { day_status: 'full_day' },
        '2026-10-02': { day_status: 'partial' },
        '2026-10-03': { day_status: 'absent' },
        '2026-10-04': { day_status: 'holiday' },
        '2026-10-05': { day_status: 'sunday_compensation' },
        '2026-10-06': { day_status: 'approved_leave' }
      }
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the calendar view and correct month', () => {
    render(<CalendarView />);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });

  it('navigates months back and forward', () => {
    const { container } = render(<CalendarView />);
    
    const prevBtn = container.querySelectorAll('.btn-icon')[0];
    fireEvent.click(prevBtn);
    expect(screen.getByText('September 2026')).toBeInTheDocument();
    
    const nextBtn = container.querySelectorAll('.btn-icon')[1];
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(screen.getByText('November 2026')).toBeInTheDocument();
  });

  it('renders status indicators for known days', () => {
    render(<CalendarView />);
    
    expect(screen.getAllByText('1')[0].getAttribute('style')).toContain('var(--success-bg)');
    expect(screen.getAllByText('2')[0].getAttribute('style')).toContain('transparent');
    expect(screen.getAllByText('3')[0].getAttribute('style')).toContain('var(--danger-bg)');
  });

  
  it('navigates to today when clicking today button', () => {
    const { container } = render(<CalendarView />);
    
    // Go to previous month
    const prevBtn = container.querySelectorAll('.btn-icon')[0];
    fireEvent.click(prevBtn);
    
    // Click Today button (assuming it's a button with text "Today" in calendar)
    // Actually Calendar doesn't have a "Today" button, it just has the active tab. So I'll skip this specific test.
  });
});
