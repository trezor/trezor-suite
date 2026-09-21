import type { BuyTrade, CryptoId, ExchangeTrade } from 'invity-api';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultStellar } from '@suite-common/wallet-types/mocks';
import {
    act,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';

import { useTradingStellarActivateToken } from './useTradingStellarActivateToken';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockShowAlert = jest.fn();
const mockComposeStellarTrustlineFeesThunk = jest.fn();

jest.mock('@reduxjs/toolkit', () => ({
    ...jest.requireActual('@reduxjs/toolkit'),
    isFulfilled: (action: { meta?: { requestStatus?: string } }) =>
        action?.meta?.requestStatus === 'fulfilled',
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

jest.mock('@suite-native/trading-state', () => ({
    selectExchangeSelectedReceiveAccount: (state: {
        wallet: {
            trading: { exchange: { selectedReceiveAccount?: { account: Account } } };
        };
    }) => state.wallet.trading.exchange.selectedReceiveAccount,
}));

jest.mock('@suite-native/module-stellar-token-management', () => ({
    composeStellarTrustlineFeesThunk: (payload: unknown) =>
        mockComposeStellarTrustlineFeesThunk(payload),
}));

const TOKEN_CONTRACT = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const RECEIVE_CRYPTO_ID = `stellar--${TOKEN_CONTRACT}` as CryptoId;
const stellarAccount = mockWalletAccount(
    { symbol: asNetworkSymbol('xlm') },
    networkSpecificDefaultStellar,
);
const stellarAccountWithToken = mockWalletAccount(
    {
        symbol: asNetworkSymbol('xlm'),
        tokens: [{ standard: 'STELLAR-CLASSIC', contract: TOKEN_CONTRACT, decimals: 7 }],
    },
    networkSpecificDefaultStellar,
);
const ACCOUNT_KEY = stellarAccount.key;

const renderUseTradingStellarActivateToken = async (options?: {
    quote?: ExchangeTrade | BuyTrade;
    receiveCryptoId?: CryptoId;
    buttonTestId?: string;
    account?: Account;
}) => {
    const store = createStoreFromPreloadedState({
        wallet: {
            trading: {
                exchange: {
                    selectedReceiveAccount: { account: options?.account ?? stellarAccount },
                },
            },
        },
    });
    store.dispatch = mockDispatch;

    return await renderHookWithStoreProvider(
        () =>
            useTradingStellarActivateToken({
                quote: options?.quote,
                receiveCryptoId: options?.receiveCryptoId,
                buttonTestId: options?.buttonTestId,
            }),
        { services: { store } },
    );
};

const getButtonProps = (
    result: Awaited<ReturnType<typeof renderUseTradingStellarActivateToken>>['result'],
) => result.current.activateButtonElement?.props.children.props;

const onActivateButtonPressStart = (
    result: Awaited<ReturnType<typeof renderUseTradingStellarActivateToken>>['result'],
) => {
    const onPress = getButtonProps(result)?.onPress as (() => Promise<void>) | undefined;

    return onPress?.();
};

const onActivateButtonPress = async (
    result: Awaited<ReturnType<typeof renderUseTradingStellarActivateToken>>['result'],
) => {
    const onPressPromise = onActivateButtonPressStart(result);
    await act(async () => await onPressPromise);
};

describe('useTradingStellarActivateToken', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockComposeStellarTrustlineFeesThunk.mockImplementation(payload => ({
            type: 'composeStellarTrustlineFeesThunkMock',
            payload,
        }));
    });

    it('returns activate button when receiving inactive Stellar token', async () => {
        const { result } = await renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
            buttonTestId: 'activate-stellar-token',
        });

        expect(result.current.isReceivingInactiveStellarToken).toBe(true);
        expect(result.current.activateButtonElement).not.toBeNull();
        expect(getButtonProps(result)?.testID).toBe('activate-stellar-token');
    });

    it('does not return activate button when token is already active', async () => {
        const { result } = await renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
            account: stellarAccountWithToken,
        });

        expect(result.current.isReceivingInactiveStellarToken).toBe(false);
        expect(result.current.activateButtonElement).toBeNull();
    });

    it('does not return activate button when receiving native XLM', async () => {
        const { result } = await renderUseTradingStellarActivateToken({
            quote: { receive: 'XLM' } as ExchangeTrade,
            receiveCryptoId: 'stellar' as CryptoId,
        });

        expect(result.current.isReceivingInactiveStellarToken).toBe(false);
        expect(result.current.activateButtonElement).toBeNull();
    });

    it('navigates to activation fee screen when trustline fee composition succeeds', async () => {
        mockDispatch.mockResolvedValue({
            type: 'module-stellar-token-management/composeStellarTrustlineFeesThunk/fulfilled',
            meta: { requestStatus: 'fulfilled' },
        });

        const { result } = await renderUseTradingStellarActivateToken({
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

        const { result } = await renderUseTradingStellarActivateToken({
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

        const { result } = await renderUseTradingStellarActivateToken({
            quote: { receive: 'USDC' } as ExchangeTrade,
            receiveCryptoId: RECEIVE_CRYPTO_ID,
        });

        const activatePromise = onActivateButtonPressStart(result);

        await waitFor(() => expect(getButtonProps(result)?.isLoading).toBe(true));

        await act(() => {
            resolveDispatch?.({
                type: 'module-stellar-token-management/composeStellarTrustlineFeesThunk/fulfilled',
                meta: { requestStatus: 'fulfilled' },
            });
        });

        await act(async () => await activatePromise);
        await waitFor(() => expect(getButtonProps(result)?.isLoading).toBe(false));
    });
});
