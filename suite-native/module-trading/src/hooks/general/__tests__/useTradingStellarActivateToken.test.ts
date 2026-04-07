import type { BuyTrade, CryptoId, ExchangeTrade } from 'invity-api';

import { act, renderHook, waitFor } from '@suite-native/test-utils';

import { useTradingStellarActivateToken } from '../useTradingStellarActivateToken';

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
const mockNavigate = jest.fn();
const mockShowAlert = jest.fn();
const mockCryptoIdToNetworkAndContractAddress = jest.fn();
const mockUseInactiveStellarTokens = jest.fn();
const mockComposeStellarTrustlineFeesThunk = jest.fn();
const mockSelectExchangeSelectedReceiveAccount = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
    ...jest.requireActual('@reduxjs/toolkit'),
    isFulfilled: (action: { meta?: { requestStatus?: string } }) =>
        action?.meta?.requestStatus === 'fulfilled',
}));

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('@suite-native/intl', () => ({
    Translation: () => null,
    useTranslate: () => ({ translate: jest.fn(id => id) }),
}));

jest.mock('@suite-common/trading', () => ({
    cryptoIdToNetworkAndContractAddress: (cryptoId?: string) =>
        mockCryptoIdToNetworkAndContractAddress(cryptoId),
}));

jest.mock('@suite-native/trading-state', () => ({
    selectExchangeSelectedReceiveAccount: (state: unknown) =>
        mockSelectExchangeSelectedReceiveAccount(state),
}));

jest.mock('@suite-native/module-stellar-token-management', () => ({
    composeStellarTrustlineFeesThunk: (payload: unknown) =>
        mockComposeStellarTrustlineFeesThunk(payload),
    useInactiveStellarTokens: (accountKey?: string) => mockUseInactiveStellarTokens(accountKey),
}));

const RECEIVE_CRYPTO_ID = 'stellar:USDC' as CryptoId;
const TOKEN_CONTRACT = 'USDC-GA123';
const ACCOUNT_KEY = 'xlm-account-key';

const renderUseTradingStellarActivateToken = (options?: {
    quote?: ExchangeTrade | BuyTrade;
    receiveCryptoId?: CryptoId;
    buttonTestId?: string;
}) =>
    renderHook(() =>
        useTradingStellarActivateToken({
            quote: options?.quote,
            receiveCryptoId: options?.receiveCryptoId,
            buttonTestId: options?.buttonTestId,
        }),
    );

const getButtonProps = (
    result: ReturnType<typeof renderUseTradingStellarActivateToken>['result'],
) => result.current.activateButtonElement?.props.children.props;

const onActivateButtonPressStart = (
    result: ReturnType<typeof renderUseTradingStellarActivateToken>['result'],
) => {
    const onPress = getButtonProps(result)?.onPress as (() => Promise<void>) | undefined;
    let onPressPromise: Promise<void> | undefined;

    act(() => {
        onPressPromise = onPress?.();
    });

    return onPressPromise;
};

const onActivateButtonPress = async (
    result: ReturnType<typeof renderUseTradingStellarActivateToken>['result'],
) => {
    const onPressPromise = onActivateButtonPressStart(result);
    await act(async () => await onPressPromise);
};

describe('useTradingStellarActivateToken', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseSelector.mockImplementation(selector => selector({}));
        mockSelectExchangeSelectedReceiveAccount.mockReturnValue({ account: { key: ACCOUNT_KEY } });

        mockCryptoIdToNetworkAndContractAddress.mockReturnValue({
            network: { networkType: 'stellar' },
            contractAddress: TOKEN_CONTRACT,
        });

        mockUseInactiveStellarTokens.mockReturnValue({
            inactiveTokens: [{ contract: TOKEN_CONTRACT }],
        });

        mockComposeStellarTrustlineFeesThunk.mockImplementation(payload => ({
            type: 'composeStellarTrustlineFeesThunkMock',
            payload,
        }));
    });

    it('returns activate button when receiving inactive Stellar token', () => {
        const { result } = renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
            buttonTestId: 'activate-stellar-token',
        });

        expect(result.current.isReceivingInactiveStellarToken).toBe(true);
        expect(result.current.activateButtonElement).not.toBeNull();
        expect(getButtonProps(result)?.testID).toBe('activate-stellar-token');
    });

    it('does not return activate button when token is already active', () => {
        mockUseInactiveStellarTokens.mockReturnValue({
            inactiveTokens: [{ contract: 'AQUA-GB456' }],
        });

        const { result } = renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
        });

        expect(result.current.isReceivingInactiveStellarToken).toBe(false);
        expect(result.current.activateButtonElement).toBeNull();
    });

    it('navigates to activation fee screen when trustline fee composition succeeds', async () => {
        mockDispatch.mockResolvedValue({
            type: 'module-stellar-token-management/composeStellarTrustlineFeesThunk/fulfilled',
            meta: { requestStatus: 'fulfilled' },
        });

        const { result } = renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
        });

        await onActivateButtonPress(result);

        expect(mockComposeStellarTrustlineFeesThunk).toHaveBeenCalledWith({
            accountKey: ACCOUNT_KEY,
            tokenContract: TOKEN_CONTRACT,
        });
        expect(mockNavigate).toHaveBeenCalledWith('StellarManageTokenStack', {
            screen: 'ActivationFee',
            params: {
                accountKey: ACCOUNT_KEY,
                tokenContract: TOKEN_CONTRACT,
                isTrading: true,
            },
        });
        expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('shows activation failed alert when trustline fee composition fails', async () => {
        mockDispatch.mockResolvedValue({
            type: 'module-stellar-token-management/composeStellarTrustlineFeesThunk/rejected',
            meta: { requestStatus: 'rejected' },
        });

        const { result } = renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
        });

        await onActivateButtonPress(result);

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalledWith({
            title: 'moduleStellarToken.networkFee.activationFailed',
            description: 'moduleStellarToken.networkFee.activationFailedDescription',
            primaryButtonTitle: 'generic.buttons.gotIt',
        });
    });

    it('toggles loading state during trustline fee composition', async () => {
        let resolveDispatch: ((value: unknown) => void) | undefined;

        mockDispatch.mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveDispatch = resolve;
                }),
        );

        const { result } = renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
        });

        const activatePromise = onActivateButtonPressStart(result);

        await waitFor(() => expect(getButtonProps(result)?.isLoading).toBe(true));

        act(() => {
            resolveDispatch?.({
                type: 'module-stellar-token-management/composeStellarTrustlineFeesThunk/fulfilled',
                meta: { requestStatus: 'fulfilled' },
            });
        });

        await act(async () => await activatePromise);
        await waitFor(() => expect(getButtonProps(result)?.isLoading).toBe(false));
    });
});
