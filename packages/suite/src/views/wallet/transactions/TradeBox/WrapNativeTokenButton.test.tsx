import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';
import { type Account } from 'src/types/wallet';

import { WrapNativeTokenButton } from './WrapNativeTokenButton';

const mockDispatch = jest.fn();

jest.mock('src/hooks/suite', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

const mockGoto = jest.fn((payload: unknown) => ({ type: 'ROUTER_GO_TO', payload }));
jest.mock('@suite/router', () => ({ goto: (payload: unknown) => mockGoto(payload) }));

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
}));

const account = {
    symbol: 'eth',
    index: 0,
    accountType: 'normal',
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

    it('navigates to the standalone wrap page when all conditions are met', () => {
        renderButton();

        const button = screen.getByTestId(WRAP_BUTTON_TESTID);
        expect(button).toBeInTheDocument();

        fireEvent.click(button);

        expect(mockGoto).toHaveBeenCalledWith({
            routeName: 'earn-yield-wrap',
            params: { symbol: 'eth', accountIndex: 0, accountType: 'normal' },
        });
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
});
