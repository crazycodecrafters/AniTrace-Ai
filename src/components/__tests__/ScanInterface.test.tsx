import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScanInterface } from '../ScanInterface';

describe('ScanInterface Component', () => {
  it('renders upload dropzone, tabs and sample scenes', () => {
    render(<ScanInterface onScanComplete={vi.fn()} onScanStart={vi.fn()} />);

    expect(screen.getByText(/Drop your anime screenshot here/i)).toBeInTheDocument();
    expect(screen.getByText('Samples')).toBeInTheDocument();
    expect(screen.getByText('Image URL')).toBeInTheDocument();
  });

  it('toggles advanced scan options bar', () => {
    render(<ScanInterface onScanComplete={vi.fn()} onScanStart={vi.fn()} />);

    const optionsButton = screen.getByRole('button', { name: /options/i });
    fireEvent.click(optionsButton);

    expect(screen.getByText(/Auto-Cut Black Borders/i)).toBeInTheDocument();
  });
});
