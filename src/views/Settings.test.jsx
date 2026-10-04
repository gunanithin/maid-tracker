import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SettingsView from './Settings';
import useStore from '../store';

describe('SettingsView Component', () => {
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
    
    global.fetch = vi.fn();
    global.alert = vi.fn();
    global.console.error = vi.fn();
  });

  it('renders settings fields correctly', () => {
    render(<SettingsView />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('toggles working days correctly', () => {
    render(<SettingsView />);
    const mondayBtn = screen.getAllByText('M')[0]; // First M is Monday
    
    // Disable Monday
    fireEvent.click(mondayBtn);
    fireEvent.click(screen.getByText('Save Settings'));
    
    expect(useStore.getState().settings.workingDays).not.toContain(1);
    
    // Enable Monday back
    fireEvent.click(mondayBtn);
    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));
    expect(useStore.getState().settings.workingDays).toContain(1);
  });

  it('handles input changes for times and checkboxes', () => {
    render(<SettingsView />);
    
    const breakfastInput = screen.getByDisplayValue('08:30');
    fireEvent.change(breakfastInput, { target: { value: '09:00' } });
    
    const sundayHolidayCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(sundayHolidayCheckbox); // Turn off
    
    const sundayCompCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(sundayCompCheckbox); // Turn off
    
    const lunchInput = screen.getByDisplayValue('13:00');
    fireEvent.change(lunchInput, { target: { value: '14:00' } });
    
    fireEvent.click(screen.getByText('Save Settings'));
    
    const settings = useStore.getState().settings;
    expect(settings.expectedBreakfastTime).toBe('09:00');
    expect(settings.expectedLunchTime).toBe('14:00');
    expect(settings.sundayHoliday).toBe(false);
    expect(settings.sundayCompensation).toBe(false);
  });

  it('handles shift configuration changes', () => {
    render(<SettingsView />);
    
    const breakfastLabelInput = screen.getByDisplayValue('Breakfast');
    fireEvent.change(breakfastLabelInput, { target: { value: 'Morning Meal' } });
    
    const breakfastIconInput = screen.getByDisplayValue('🍳');
    fireEvent.change(breakfastIconInput, { target: { value: '🥓' } });
    
    const checkboxes = screen.getAllByRole('checkbox');
    const dinnerCheckbox = checkboxes[checkboxes.length - 1];
    fireEvent.click(dinnerCheckbox);
    
    fireEvent.click(screen.getByText('Save Settings'));
    
    const settings = useStore.getState().settings;
    expect(settings.shifts[0].label).toBe('Morning Meal');
    expect(settings.shifts[0].icon).toBe('🥓');
    expect(settings.shifts[2].enabled).toBe(true);
  });

  it('handles sync successfully with records', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        records: [{ date: '2026-10-01', day_status: 'full_day' }]
      })
    });
    
    render(<SettingsView />);
    const webhookInput = screen.getByPlaceholderText(/https:\/\/script\.google\.com/i);
    fireEvent.change(webhookInput, { target: { value: 'https://webhook.test' } });
    
    fireEvent.click(screen.getByText('⬇️ Sync Data from Google Sheets'));
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Successfully synced 1 records from Google Sheets!');
    });
  });

  it('handles sync successfully with empty records', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ records: null })
    });
    
    render(<SettingsView />);
    const webhookInput = screen.getByPlaceholderText(/https:\/\/script\.google\.com/i);
    fireEvent.change(webhookInput, { target: { value: 'https://webhook.test' } });
    
    fireEvent.click(screen.getByText('⬇️ Sync Data from Google Sheets'));
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Sync successful, but no records were found.');
    });
  });

  it('handles sync failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network Error'));
    
    render(<SettingsView />);
    const webhookInput = screen.getByPlaceholderText(/https:\/\/script\.google\.com/i);
    fireEvent.change(webhookInput, { target: { value: 'https://webhook.test' } });
    
    fireEvent.click(screen.getByText('⬇️ Sync Data from Google Sheets'));
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Sync failed. Please ensure you updated your Apps Script with the doGet function from the README.');
    });
  });
  
  it('does nothing if sync clicked without webhook URL', () => {
    render(<SettingsView />);
    const syncButton = screen.getByRole('button', { name: /Sync Data/i });
    expect(syncButton).toBeDisabled();
    
    // Attempt sync with empty string
    const webhookInput = screen.getByPlaceholderText(/https:\/\/script\.google\.com/i);
    fireEvent.change(webhookInput, { target: { value: '' } });
    fireEvent.click(syncButton); // Still disabled, but lets explicitly trigger to hit branch
  });
});
