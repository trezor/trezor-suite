import { useEffect } from 'react';

import { BuyTrade } from 'invity-api';

import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import quotes from '../../../__fixtures__/quotes.json';
import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { TradingBuyFormValues } from '../../../types';
import { useTradingBuyFlow } from '../useBuyFlow';
import { useTradingBuyForm } from '../useBuyForm';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    buyThunks: {
        selectQuoteThunk: (payload: unknown) => ({
            type: 'selectQuoteThunkMock',
            payload,
        }),
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
        }),
    },
}));

describe('useTradingBuyFlow', () => {
    const getInitializedStore = async ({ isLoading }: { isLoading?: boolean }) => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingStateWithQuotes() },
        };
        if (isLoading !== undefined) {
            preloadedState.wallet!.tradingNew!.buy!.isLoading = isLoading;
        }

        return await initStore(preloadedState);
    };

    const renderUseTradingBuyFlow = ({
        store,
        ...formValues
    }: Partial<TradingBuyFormValues> & { store: TestStore }) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useTradingBuyForm();
                const { setValue } = form;

                useEffect(() => {
                    // Set all provided form values
                    Object.entries(formValues).forEach(([key, value]) => {
                        act(() => {
                            setValue(key as keyof TradingBuyFormValues, value);
                        });
                    });
                }, [setValue]);

                return useTradingBuyFlow(form);
            },
            { store },
        );

    it('should canProceed be false when loading', async () => {
        const store = await getInitializedStore({ isLoading: true });

        const { result } = await renderUseTradingBuyFlow({ store });
        expect(result.current.canProceed).toBe(false);
    });

    it('should canProceed be true when not loading and orderId filters one in quotes', async () => {
        const store = await getInitializedStore({ isLoading: false });

        const { result } = await renderUseTradingBuyFlow({
            store,
            quote: quotes[1] as BuyTrade,
        });

        expect(result.current.canProceed).toBe(true);
    });

    it('should handle user consent flow', async () => {
        const store = await getInitializedStore({ isLoading: false });
        const btcAccount = getBtcAccount();
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        const { result } = await renderUseTradingBuyFlow({
            store,
            quote: quotes[2] as BuyTrade,
            receiveAccount: { account: btcAccount, address: btcAccount.addresses?.used?.[0] },
        });

        act(() => {
            result.current.selectQuote();
        });

        const dispatchCall = dispatchSpy.mock.calls[0][0];
        const { userConsent } = dispatchCall.payload;

        act(() => {
            userConsent('provider', 'BTC');
        });

        expect(result.current.isConsentRequested).toBe(true);

        act(() => {
            result.current.giveConsent();
        });

        expect(result.current.isConsentRequested).toBe(false);
    });

    it('should call nextStep callback with correct address', async () => {
        const store = await getInitializedStore({ isLoading: false });
        const btcAccount = getBtcAccount();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const expectedAddress = btcAccount.addresses?.used?.[0]?.address ?? btcAccount.descriptor;

        const { result } = await renderUseTradingBuyFlow({
            store,
            quote: quotes[2] as BuyTrade,
            receiveAccount: { account: btcAccount, address: btcAccount.addresses?.used?.[0] },
        });

        act(() => {
            result.current.selectQuote();
        });

        const dispatchCall = dispatchSpy.mock.calls[0][0];
        const { nextStep } = dispatchCall.payload;

        act(() => {
            nextStep();
        });

        expect(store.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'confirmTradeThunkMock',
                payload: expect.objectContaining({
                    address: expectedAddress,
                }),
            }),
        );
    });
});
