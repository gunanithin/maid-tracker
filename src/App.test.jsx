import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App.jsx';
import useStore from './store.js';

describe('App Component', () => {
  beforeEach(() => {
    useStore.setState({
      settings: {
        workingDays: [1, 2, 3, 4, 5, 6],
        shifts: [
          { id: 'breakfast', label: 'Breakfast', icon: '🍳', enabled: true }
        ]
      },
      records: {}
    });
  });

  it('renders TodayView by default', () => {
    render(<App />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('navigates between all tabs', () => {
    const { container } = render(<App />);
    
    // Check Today is active
    expect(screen.getByText('Today')).toBeInTheDocument();
    
    // Click Calendar
    fireEvent.click(container.querySelector('.nav-item:nth-child(2)'));
    expect(screen.getByRole('heading', { name: /Calendar/i })).toBeInTheDocument();
    
    // Click Reports
    fireEvent.click(container.querySelector('.nav-item:nth-child(3)'));
    expect(screen.getByText(/Scorecard/i)).toBeInTheDocument();
    
    // Click Settings
    fireEvent.click(container.querySelector('.nav-item:nth-child(4)'));
    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
    
    // Click Today back
    fireEvent.click(container.querySelector('.nav-item:nth-child(1)'));
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});
