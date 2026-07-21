import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';
import { type Account } from 'src/types/wallet';

import { WrapNativeTokenButton } from '../WrapNativeTokenButton';

const mockDispatch = jest.fn();

jest.mock('src/hooks/suite', () => ({
    useDispatch: () => mockDispatch,
    // The component reads debug mode only through the (mocked) selector, so invoking it with no
    // state is enough here.
    useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const mockOpenModal = jest.fn((payload: unknown) => ({ type: 'MODAL_OPEN', payload }));
jest.mock('@suite/modal', () => ({ openModal: (payload: unknown) => mockOpenModal(payload) }));

const mockSelectIsDebugModeActive = jest.fn();
jest.mock('@suite/debug', () => ({
    selectIsDebugModeActive: () => mockSelectIsDebugModeActive(),
}));

const mockGetNetworkType = jest.fn();
const mockGetWrappedNativeAddress = jest.fn();
const mockGetWrappedNativeSymbol = jest.fn();
jest.mock('@suite-common/wallet-config', () => ({
    ...jest.requireActual('@suite-common/wallet-config'),
    getNetworkType: (symbol: string) => mockGetNetworkType(symbol),
    getWrappedNativeAddress: (symbol: string) => mockGetWrappedNativeAddress(symbol),
    getWrappedNativeSymbol: (symbol: string) => mockGetWrappedNativeSymbol(symbol),
    getNetworkDisplaySymbol: () => 'ETH',
}));

const account = {
    symbol: 'eth',
    formattedBalance: '1.5',
    networkType: 'ethereum',
} as unknown as Account;

const WRAP_BUTTON_TESTID = '@trading/menu/wrap-native-token';

const renderButton = () =>
    render(
        <ThemeProvider>
            <WrapNativeTokenButton account={account} />
        </ThemeProvider>,
    );

describe('WrapNativeTokenButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Happy-path defaults; individual tests override one condition.
        mockSelectIsDebugModeActive.mockReturnValue(true);
        mockGetNetworkType.mockReturnValue('ethereum');
        mockGetWrappedNativeAddress.mockReturnValue('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        mockGetWrappedNativeSymbol.mockReturnValue('WETH');
    });

    it('renders nothing when debug mode is off', () => {
        mockSelectIsDebugModeActive.mockReturnValue(false);
        renderButton();
        expect(screen.queryByTestId(WRAP_BUTTON_TESTID)).not.toBeInTheDocument();
    });

    it('renders nothing on a non-EVM network', () => {
        mockGetNetworkType.mockReturnValue('bitcoin');
        renderButton();
        expect(screen.queryByTestId(WRAP_BUTTON_TESTID)).not.toBeInTheDocument();
    });

    it('renders nothing when the network has no wrapped-native token', () => {
        mockGetWrappedNativeAddress.mockReturnValue(undefined);
        mockGetWrappedNativeSymbol.mockReturnValue(undefined);
        renderButton();
        expect(screen.queryByTestId(WRAP_BUTTON_TESTID)).not.toBeInTheDocument();
    });

    it('opens the wrap modal with the depositable max when all conditions are met', () => {
        renderButton();

        const button = screen.getByTestId(WRAP_BUTTON_TESTID);
        expect(button).toBeInTheDocument();

        fireEvent.click(button);

        // 1.5 native balance minus the 0.005 gas reserve.
        expect(mockOpenModal).toHaveBeenCalledWith({
            type: 'wrap-native-token',
            account,
            maxWrapAmount: '1.495',
            nativeSymbol: 'ETH',
            wrappedSymbol: 'WETH',
        });
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
});
