import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TodayView from './Today';
import useStore from '../store';
import { format } from 'date-fns';

describe('TodayView Component', () => {
  beforeEach(() => {
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T08:00:00Z')); // Mock time to Monday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders today view and active shifts', () => {
    render(<TodayView />);
    expect(screen.getByText(/Breakfast/i)).toBeInTheDocument();
    expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
  });

  it('records shift as completed and missed', () => {
    render(<TodayView />);
    
    // Complete breakfast
    const completedBtns = screen.getAllByRole('button', { name: /Completed/i });
    fireEvent.click(completedBtns[0]);
    
    // Miss lunch
    const missedBtns = screen.getAllByRole('button', { name: /Missed/i });
    fireEvent.click(missedBtns[1]); // Lunch missed
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const records = useStore.getState().records;
    
    expect(records[dateStr].breakfast_status).toBe('completed');
    expect(records[dateStr].lunch_status).toBe('missed');
  });
  
  it('updates notes and arrival time', () => {
    render(<TodayView />);
    
    // Notes
    const textarea = screen.getByPlaceholderText(/Reason for absence or late/i);
    fireEvent.change(textarea, { target: { value: 'Arrived early' } });
    
    // Arrival Time (assuming it is the first time input)
    const timeInput = screen.getAllByDisplayValue('')[0]; // It's an input type="time" with value=""
    fireEvent.change(timeInput, { target: { value: '08:45' } });
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const records = useStore.getState().records;
    
    expect(records[dateStr].notes).toBe('Arrived early');
    expect(records[dateStr].arrival_time).toBe('08:45');
  });
  
  it('handles absent toggle correctly', () => {
    render(<TodayView />);
    
    const absentToggle = screen.getByLabelText(/Mark as Holiday/i);
    fireEvent.click(absentToggle); // Enable absent/holiday mode
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    expect(useStore.getState().records[dateStr].approved_leave).toBe(true);
  });

  it('handles late toggle correctly', () => {
    render(<TodayView />);
    
    const lateToggle = screen.getByLabelText(/Arrived Late/i);
    fireEvent.click(lateToggle);
    
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    expect(useStore.getState().records[dateStr].late).toBe(true);
  });
  
  it('navigates days back and forward', () => {
    const { container } = render(<TodayView />);
    
    expect(screen.getByText('Monday, Oct 5th')).toBeInTheDocument();
    
    // Click left chevron
    const prevDayBtn = container.querySelectorAll('.btn-icon')[0];
    fireEvent.click(prevDayBtn);
    
    expect(screen.getByText('Sunday, Oct 4th')).toBeInTheDocument();
    
    // Test hidden date input with valid date
    const dateInput = container.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2026-10-02' } });
    expect(screen.getByText('Friday, Oct 2nd')).toBeInTheDocument();
    
    // Test hidden date input with future date (should ignore)
    fireEvent.change(dateInput, { target: { value: '2026-10-06' } });
    expect(screen.getByText('Friday, Oct 2nd')).toBeInTheDocument();
    
    // Test N/A button
    const naBtn = screen.getAllByRole('button', { name: /N\/A/i })[0];
    fireEvent.click(naBtn);
    expect(useStore.getState().records['2026-10-02'].breakfast_status).toBe('not_applicable');
  });

  it('handles sunday compensation checks', () => {
    // Mock time to Sunday
    vi.setSystemTime(new Date('2026-10-04T08:00:00Z'));
    render(<TodayView />);
    
    // Find sunday comp toggles
    const workedToggle = screen.getByLabelText(/Completed Compensation \(Worked\)/i);
    fireEvent.click(workedToggle);
    expect(useStore.getState().records['2026-10-04'].sunday_compensation).toBe(true);
    
    const waivedToggle = screen.getByLabelText(/Waive Pending Compensation/i);
    fireEvent.click(waivedToggle);
    expect(useStore.getState().records['2026-10-04'].comp_waived).toBe(true);
  });
});
