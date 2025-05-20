import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { trezorTheme } from '@trezor/theme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { FreshAddress } from './FreshAddress';
import { FullAddressModal } from './FullAddressModal'; // To access its mock
import * as walletUtils from '@suite-common/wallet-utils';
import * as receiveActions from 'src/actions/wallet/receiveActions';
import * as suiteHooks from 'src/hooks/suite'; // To mock useSelector and useDispatch

// --- Mocks ---
jest.mock('./FullAddressModal', () => ({
  FullAddressModal: jest.fn(() => <div data-testid="mock-full-address-modal">FullAddressModal</div>),
}));

jest.mock('src/components/suite/Translation', () => ({
  Translation: ({ id, children }: { id: string; children?: React.ReactNode }) => (
    <>{children || id}</>
  ),
}));

jest.mock('@suite-common/wallet-utils', () => ({
  getFirstFreshAddress: jest.fn(),
}));

// Mocking @trezor/components that are not central to this component's logic
jest.mock('@trezor/components', () => {
  const original = jest.requireActual('@trezor/components');
  return {
    ...original,
    Banner: jest.fn(({ children }) => <div data-testid="mock-banner">{children}</div>),
    Tooltip: jest.fn(({ children, content }) => (
      <div data-testid="mock-tooltip">
        {children}
        {content && <div data-testid="mock-tooltip-content">{content}</div>}
      </div>
    )),
    GradientOverlay: jest.fn(() => <div data-testid="mock-gradient-overlay"></div>),
  };
});

jest.mock('@suite-common/wallet-config', () => ({
    getNetwork: jest.fn(symbol => ({ name: `${symbol} Network` })),
}));


// Mock Redux hooks
jest.mock('src/hooks/suite');
const mockUseDispatch = jest.fn();
const mockUseSelector = jest.fn();

(suiteHooks.useDispatch as jest.Mock).mockReturnValue(mockUseDispatch);
(suiteHooks.useSelector as jest.Mock).mockImplementation(selector => mockUseSelector(selector));


// --- Test Setup ---
const mockStore = configureStore([]);
const defaultStore = mockStore({
  // Initial minimal store state, can be overridden in tests
  wallet: {
    selectedAccount: {
      account: {
        key: 'account-key',
        symbol: 'btc',
        accountType: 'segwit',
        networkType: 'bitcoin',
        addresses: { used: [], unused: [{ address: 'initialUnusedAddress', path: 'm/0/1'}] },
      },
    },
    receive: {}, // receive state
  },
  suite: {
    isFirmwareAuthenticityCheckEnabledAndHardFailed: false, // Example for selectIsFirmwareAuthenticityCheckEnabledAndHardFailed
  },
  // Add other necessary state slices
});

const defaultAccount = {
  key: 'btc-segwit-account',
  symbol: 'btc',
  accountType: 'segwit',
  networkType: 'bitcoin',
  addresses: { used: [], unused: [{ address: 'unusedAddress0', path: 'm/0/0' }] },
  balance: '0',
  path: "m/49'/0'/0'",
  name: 'BTC Account 1',
};

const defaultProps = {
  account: defaultAccount as any,
  addresses: {} as any, // This will be populated by getFirstFreshAddress mock
  disabled: false,
  locked: false,
  pendingAddresses: [],
  isDeviceConnected: true,
};

const renderWithProviders = (ui: React.ReactElement, customStore?: any) => {
  return render(
    <Provider store={customStore || defaultStore}>
      <ThemeProvider theme={trezorTheme}>{ui}</ThemeProvider>
    </Provider>
  );
};


describe('FreshAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default selector mocks
    mockUseSelector.mockImplementation(selector => {
      if (selector.name === 'selectIsAccountUtxoBased') return true;
      if (selector.name === 'selectIsFirmwareAuthenticityCheckEnabledAndHardFailed') return false;
      return undefined;
    });
  });

  describe('"Show full address" button', () => {
    it('does not render "Show full address" button when no address is available', () => {
      (walletUtils.getFirstFreshAddress as jest.Mock).mockReturnValue(null);
      renderWithProviders(<FreshAddress {...defaultProps} />);
      expect(screen.queryByTestId('@freshAddress/show-full-address-button')).not.toBeInTheDocument();
    });

    it('renders "Show full address" button when an address is available', () => {
      (walletUtils.getFirstFreshAddress as jest.Mock).mockReturnValue({
        address: 'testAddressShort',
        path: 'm/0/0',
      });
      renderWithProviders(<FreshAddress {...defaultProps} />);
      expect(screen.getByTestId('@freshAddress/show-full-address-button')).toBeInTheDocument();
      expect(screen.getByText('SHOW_FULL_ADDRESS_BUTTON_LABEL')).toBeInTheDocument();
    });

    it('clicking "Show full address" button makes FullAddressModal visible by setting isOpen to true', () => {
      const freshAddressData = { address: 'testAddressFull', path: 'm/0/0' };
      (walletUtils.getFirstFreshAddress as jest.Mock).mockReturnValue(freshAddressData);
      
      renderWithProviders(<FreshAddress {...defaultProps} />);

      // Initially, modal should not be open
      expect(FullAddressModal).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpen: false }),
        expect.anything()
      );

      const showFullAddressButton = screen.getByTestId('@freshAddress/show-full-address-button');
      fireEvent.click(showFullAddressButton);

      // Modal should now be open
      expect(FullAddressModal).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpen: true, fullAddress: freshAddressData.address }),
        expect.anything()
      );
    });
  });

  describe('FullAddressModal integration', () => {
    const freshAddressData = { address: 'fullMockAddressForModal', path: 'm/0/0' };

    beforeEach(() => {
        (walletUtils.getFirstFreshAddress as jest.Mock).mockReturnValue(freshAddressData);
    });

    it('FullAddressModal is rendered with correct props when "Show full address" is clicked', () => {
      renderWithProviders(<FreshAddress {...defaultProps} />);
      const showFullAddressButton = screen.getByTestId('@freshAddress/show-full-address-button');
      fireEvent.click(showFullAddressButton);

      expect(FullAddressModal).toHaveBeenCalledTimes(2); // Initial render (closed) + after click (open)
      expect(FullAddressModal).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          fullAddress: freshAddressData.address,
          onClose: expect.any(Function),
        }),
        expect.anything()
      );
    });

    it('FullAddressModal is hidden when its onClose prop is called', () => {
      renderWithProviders(<FreshAddress {...defaultProps} />);
      const showFullAddressButton = screen.getByTestId('@freshAddress/show-full-address-button');
      
      // Open the modal
      fireEvent.click(showFullAddressButton);
      expect(FullAddressModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true }), {});

      // Simulate onClose call from FullAddressModal
      // Get the last call to FullAddressModal mock and extract the onClose prop
      const lastCallArgs = (FullAddressModal as jest.Mock).mock.calls.slice(-1)[0];
      const onCloseCallback = lastCallArgs[0].onClose;

      act(() => {
        onCloseCallback();
      });
      
      // Now check if FullAddressModal is called with isOpen: false
      // It will be called again due to state update causing re-render
      expect(FullAddressModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false }), {});
    });

    it('FullAddressModal is initially rendered with isOpen: false', () => {
        renderWithProviders(<FreshAddress {...defaultProps} />);
        expect(FullAddressModal).toHaveBeenCalledTimes(1);
        expect(FullAddressModal).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isOpen: false,
                fullAddress: freshAddressData.address, // it gets the address even if closed
                onClose: expect.any(Function),
            }),
            expect.anything()
        );
    });
  });

  // Test for "Reveal Address" button to ensure basic functionality is still there
  describe('Reveal Address button functionality', () => {
    it('dispatches showAddress action when "Reveal address" button is clicked', () => {
        const freshAddressData = { address: 'revealThisAddress', path: 'm/49/0/0/0/0' };
        (walletUtils.getFirstFreshAddress as jest.Mock).mockReturnValue(freshAddressData);
        jest.spyOn(receiveActions, 'showAddress'); // Spy on the actual action creator

        renderWithProviders(<FreshAddress {...defaultProps} />);

        // The button text is "RECEIVE_ADDRESS_REVEAL"
        const revealButton = screen.getByText('RECEIVE_ADDRESS_REVEAL').closest('button');
        expect(revealButton).toBeInTheDocument();
        
        if (revealButton) {
            fireEvent.click(revealButton);
        }

        expect(mockUseDispatch).toHaveBeenCalledWith(receiveActions.showAddress(freshAddressData.path, freshAddressData.address));
    });
  });
});
