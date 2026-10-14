import { type Store } from '@reduxjs/toolkit';
import type { CoinInfo, CryptoId } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import {
    btcAsset,
    ethAsset,
    getBtcAccount,
    getEthAccount,
    usdtAsset,
} from '@suite-native/trading-fixtures';
import {
    type TradingRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
    selectExchangeSelectedSendAccount,
    tradingActions,
} from '@suite-native/trading-state';
import { type ExchangeFormType, type TradeableAsset } from '@suite-native/trading-types';

import { useExchangeForm } from './useExchangeForm';
import { useExchangeFormDefaultAssets } from './useExchangeFormDefaultAssets';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState & WalletSettingsRootState;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));

const mockedSelectMyAssets = jest.mocked(selectAccountsWithTokensToSellSectionListByTradingType);

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const USDT_CRYPTO_ID = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

const usdtCoinInfo: CoinInfo = {
    symbol: 'usdt',
    name: 'Tether',
    coingeckoId: 'tether',
    services: { buy: true, sell: true, exchange: true },
};

const btcAccount = getBtcAccount();
const ethAccount = getEthAccount();

const createAccountSection = (account: Account, cryptoIds: CryptoId[]) => ({
    key: `section_${account.key}`,
    label: account.accountLabel ?? '',
    sectionData: account,
    data: cryptoIds.map(cryptoId => ({
        symbol: asNetworkSymbol(account.symbol),
        name: cryptoId,
        balance: '1',
        fiatBalance: null,
        cryptoId,
        isEnabled: true,
    })),
});

describe('useExchangeFormDefaultAssets', () => {
    let store: Store<State>;

    const renderExchangeFormWithDefaults = async () =>
        await renderHookWithStoreProvider(
            () => {
                const form = useExchangeForm();
                useExchangeFormDefaultAssets(form);

                return form;
            },
            { services: { ...services, store } },
        );

    beforeEach(() => {
        store = createTradingTestStore({
            tradeType: 'exchange',
            overrides: {
                wallet: { trading: { info: { coins: { [USDT_CRYPTO_ID]: usdtCoinInfo } } } },
            },
        });
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should preselect USDT to bitcoin when the user holds USDT', async () => {
        mockedSelectMyAssets.mockReturnValue([
            createAccountSection(btcAccount, ['bitcoin' as CryptoId]),
            createAccountSection(ethAccount, ['ethereum' as CryptoId, USDT_CRYPTO_ID]),
        ]);

        const { result } = await renderExchangeFormWithDefaults();

        expect(result.current.getValues('sendAsset')?.cryptoId).toBe(USDT_CRYPTO_ID);
        expect(result.current.getValues('sendAccount')?.key).toBe(ethAccount.key);
        expect(selectExchangeSelectedSendAccount(store.getState())?.key).toBe(ethAccount.key);
        expect(result.current.getValues('receiveAsset')?.cryptoId).toBe('bitcoin');
    });

    it('should preselect only the bitcoin receive asset when the user holds no USDT', async () => {
        mockedSelectMyAssets.mockReturnValue([
            createAccountSection(ethAccount, ['ethereum' as CryptoId]),
        ]);

        const { result } = await renderExchangeFormWithDefaults();

        expect(result.current.getValues('sendAsset')).toBeUndefined();
        expect(result.current.getValues('sendAccount')).toBeUndefined();
        expect(result.current.getValues('receiveAsset')?.cryptoId).toBe('bitcoin');
    });

    describe('on form reset request', () => {
        const selectPair = async (
            form: ExchangeFormType,
            sendAsset: TradeableAsset,
            receiveAsset: TradeableAsset,
        ) => {
            await act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btcAccount.key));
                form.setValue('sendAsset', sendAsset);
                form.setValue('receiveAsset', receiveAsset);
                form.setValue('sendCryptoAmount', '1');
            });
        };

        const requestFormReset = async () => {
            await act(() => {
                store.dispatch(tradingActions.requestTradingFormReset('exchange'));
            });
        };

        beforeEach(() => {
            reportMock.mockClear();
        });

        it('should replace the selected pair with USDT to bitcoin', async () => {
            mockedSelectMyAssets.mockReturnValue([
                createAccountSection(btcAccount, ['bitcoin' as CryptoId]),
                createAccountSection(ethAccount, ['ethereum' as CryptoId, USDT_CRYPTO_ID]),
            ]);
            const { result } = await renderExchangeFormWithDefaults();
            await selectPair(result.current, btcAsset, ethAsset);

            await requestFormReset();

            expect(result.current.getValues('sendAsset')?.cryptoId).toBe(USDT_CRYPTO_ID);
            expect(result.current.getValues('sendAccount')?.key).toBe(ethAccount.key);
            expect(selectExchangeSelectedSendAccount(store.getState())?.key).toBe(ethAccount.key);
            expect(result.current.getValues('receiveAsset')?.cryptoId).toBe('bitcoin');
            expect(result.current.getValues('sendCryptoAmount')).toBeUndefined();
            expect(reportMock).not.toHaveBeenCalled();
        });

        it('should clear the send side and select bitcoin to receive when the user holds no USDT', async () => {
            mockedSelectMyAssets.mockReturnValue([
                createAccountSection(btcAccount, ['bitcoin' as CryptoId]),
            ]);
            const { result } = await renderExchangeFormWithDefaults();
            await selectPair(result.current, btcAsset, ethAsset);

            await requestFormReset();

            expect(result.current.getValues('sendAsset')).toBeUndefined();
            expect(result.current.getValues('sendAccount')).toBeUndefined();
            expect(selectExchangeSelectedSendAccount(store.getState())).toBeUndefined();
            expect(result.current.getValues('receiveAsset')?.cryptoId).toBe('bitcoin');
            expect(reportMock).not.toHaveBeenCalled();
        });

        it('should not report analytics when the default send asset collides with the selected receive asset', async () => {
            mockedSelectMyAssets.mockReturnValue([
                createAccountSection(btcAccount, ['bitcoin' as CryptoId]),
                createAccountSection(ethAccount, ['ethereum' as CryptoId, USDT_CRYPTO_ID]),
            ]);
            const { result } = await renderExchangeFormWithDefaults();
            await selectPair(result.current, btcAsset, usdtAsset);

            await requestFormReset();

            expect(result.current.getValues('sendAsset')?.cryptoId).toBe(USDT_CRYPTO_ID);
            expect(result.current.getValues('receiveAsset')?.cryptoId).toBe('bitcoin');
            expect(reportMock).not.toHaveBeenCalled();
        });
    });
});
