import { type Store } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { tradingSellActions } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { type SectionListData } from '@suite-native/trading-atoms';
import { ethAsset, getBtcAccount, getEthAccount } from '@suite-native/trading-fixtures';
import {
    type TradingRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
    selectSellSelectedSendAccount,
    selectTradingFormResetRequestedFor,
    tradingActions,
} from '@suite-native/trading-state';
import { type MyAsset } from '@suite-native/trading-types';

import { useSellForm } from './useSellForm';
import { useSellFormDefaultAssets } from './useSellFormDefaultAssets';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';

type State = TradingRootState & AccountsRootState & WalletSettingsRootState;

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));

const mockedSelectMyAssets =
    selectAccountsWithTokensToSellSectionListByTradingType as unknown as jest.Mock;

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const btcAccount = getBtcAccount();
const ethAccount = getEthAccount();

const createAccountSection = (account: Account, cryptoId: CryptoId) => ({
    key: `section_${account.key}`,
    label: account.accountLabel ?? '',
    sectionData: account,
    data: [
        {
            symbol: asNetworkSymbol(account.symbol),
            name: cryptoId,
            balance: '1',
            fiatBalance: null,
            cryptoId,
            isEnabled: true,
        },
    ],
});

const btcSection = createAccountSection(btcAccount, 'bitcoin' as CryptoId);
const ethSection = createAccountSection(ethAccount, 'ethereum' as CryptoId);

describe('useSellFormDefaultAssets', () => {
    let store: Store<State>;

    const renderSellFormWithDefaults = async () =>
        await renderHookWithStoreProvider(
            () => {
                const form = useSellForm();
                useSellFormDefaultAssets(form);

                return form;
            },
            { services: { ...services, store } },
        );

    const mockMyAssets = (myAssets: SectionListData<MyAsset, Account>) =>
        mockedSelectMyAssets.mockReturnValue(myAssets);

    beforeEach(() => {
        reportMock.mockClear();
        store = createTradingTestStore({ tradeType: 'sell' });
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should preselect bitcoin together with its account', async () => {
        mockMyAssets([ethSection, btcSection]);

        const { result } = await renderSellFormWithDefaults();

        expect(result.current.getValues('sendAsset')?.cryptoId).toBe('bitcoin');
        expect(result.current.getValues('sendAccount')?.key).toBe(btcAccount.key);
        expect(selectSellSelectedSendAccount(store.getState())?.key).toBe(btcAccount.key);
        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should fall back to ethereum when the user holds no bitcoin', async () => {
        mockMyAssets([ethSection]);

        const { result } = await renderSellFormWithDefaults();

        expect(result.current.getValues('sendAsset')?.cryptoId).toBe('ethereum');
        expect(result.current.getValues('sendAccount')?.key).toBe(ethAccount.key);
    });

    it('should leave the send side empty when the user holds no default asset', async () => {
        mockMyAssets([]);

        const { result } = await renderSellFormWithDefaults();

        expect(result.current.getValues('sendAsset')).toBeUndefined();
        expect(result.current.getValues('sendAccount')).toBeUndefined();
    });

    describe('on form reset request', () => {
        const requestFormReset = async () => {
            await act(() => {
                store.dispatch(tradingActions.requestTradingFormReset('sell'));
            });
        };

        it('should replace the selected asset with the default one', async () => {
            mockMyAssets([ethSection, btcSection]);
            const { result } = await renderSellFormWithDefaults();

            await act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(ethAccount.key));
                result.current.setValue('sendAsset', ethAsset);
                result.current.setValue('cryptoStringAmount', '1');
            });

            await requestFormReset();

            expect(result.current.getValues('sendAsset')?.cryptoId).toBe('bitcoin');
            expect(result.current.getValues('sendAccount')?.key).toBe(btcAccount.key);
            expect(selectSellSelectedSendAccount(store.getState())?.key).toBe(btcAccount.key);
            expect(result.current.getValues('cryptoStringAmount')).toBeUndefined();
            expect(selectTradingFormResetRequestedFor(store.getState())).toBeUndefined();
            expect(reportMock).not.toHaveBeenCalled();
        });

        it('should clear the send side when the user no longer holds a default asset', async () => {
            mockMyAssets([btcSection]);
            const { result } = await renderSellFormWithDefaults();

            mockMyAssets([]);
            await requestFormReset();

            expect(result.current.getValues('sendAsset')).toBeUndefined();
            expect(result.current.getValues('sendAccount')).toBeUndefined();
            expect(selectSellSelectedSendAccount(store.getState())).toBeUndefined();
        });
    });
});
