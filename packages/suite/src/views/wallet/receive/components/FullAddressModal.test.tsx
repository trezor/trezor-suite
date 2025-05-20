import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { trezorTheme } from '@trezor/theme';

import { FullAddressModal } from './FullAddressModal';
import { copyToClipboard } from '@trezor/dom-utils';

// Mock dependencies
jest.mock('@trezor/dom-utils', () => ({
  copyToClipboard: jest.fn(),
}));

jest.mock('src/components/suite/Translation', () => ({
  Translation: ({ id, children }: { id: string; children?: React.ReactNode }) => (
    <>{children || id}</> // Simplified mock for easier text assertion
  ),
}));

jest.mock('src/components/suite/Address', () => ({
  Address: jest.fn(({ address, "data-testid": dataTestId }) => <div data-testid={dataTestId || "mock-address"}>{address}</div>),
}));

jest.mock('src/components/suite/QrCode', () => ({
  QrCode: jest.fn(({ data }) => <div data-testid="mock-qrcode">{data}</div>),
}));


const mockAddress = 'testAddress1234567890';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={trezorTheme}>{ui}</ThemeProvider>);
};

describe('FullAddressModal', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    (copyToClipboard as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('renders correctly when isOpen is true', () => {
      const handleClose = jest.fn();
      renderWithTheme(
        <FullAddressModal isOpen={true} onClose={handleClose} fullAddress={mockAddress} />
      );

      expect(screen.getByText('FULL_ADDRESS_MODAL_TITLE')).toBeInTheDocument();
      expect(screen.getByTestId('mock-address')).toHaveTextContent(mockAddress);
      expect(screen.getByTestId('mock-qrcode')).toHaveTextContent(mockAddress);
      expect(screen.getByText('COPY_ADDRESS_BUTTON_LABEL')).toBeInTheDocument();
      // The Modal component might render the label directly or via the Translation mock
      expect(screen.getByText((content, element) => {
        // Check if the content is 'Close' and the element is a button or part of the footer
        return content === 'CLOSE_BUTTON_LABEL' && (element?.tagName.toLowerCase() === 'span' || element?.tagName.toLowerCase() === 'button');
      })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const handleClose = jest.fn();
      const { container } = renderWithTheme(
        <FullAddressModal isOpen={false} onClose={handleClose} fullAddress={mockAddress} />
      );
      // When isOpen is false, the component returns null
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Actions', () => {
    it('calls onClose when the close button is clicked', () => {
      const handleClose = jest.fn();
      renderWithTheme(
        <FullAddressModal isOpen={true} onClose={handleClose} fullAddress={mockAddress} />
      );

      // Find the close button by its data-testid from the component
      // The actual button is rendered by the Modal component, we look for its label
      // The buttonProps in FullAddressModal passes data-testid to the underlying button component
      const closeButton = screen.getByTestId('@fullAddressModal/close-button');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls copyToClipboard with fullAddress when copy button is clicked', () => {
      const handleClose = jest.fn();
      renderWithTheme(
        <FullAddressModal isOpen={true} onClose={handleClose} fullAddress={mockAddress} />
      );

      const copyButton = screen.getByTestId('@fullAddressModal/copy-button');
      fireEvent.click(copyButton);

      expect(copyToClipboard).toHaveBeenCalledWith(mockAddress);
      expect(copyToClipboard).toHaveBeenCalledTimes(1);
    });

    it('shows "Copied!" feedback when copy button is clicked and resets', async () => {
      jest.useFakeTimers();
      const handleClose = jest.fn();
      renderWithTheme(
        <FullAddressModal isOpen={true} onClose={handleClose} fullAddress={mockAddress} />
      );

      const copyButton = screen.getByTestId('@fullAddressModal/copy-button');
      expect(copyButton).toHaveTextContent('COPY_ADDRESS_BUTTON_LABEL');

      fireEvent.click(copyButton);
      expect(copyButton).toHaveTextContent('COPIED_FEEDBACK_TEXT');

      // Fast-forward timers
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(copyButton).toHaveTextContent('COPY_ADDRESS_BUTTON_LABEL');
      jest.useRealTimers();
    });
  });
});
