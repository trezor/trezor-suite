import { combineReducers } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import {
    btcAsset,
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
    getWalletState,
} from '@suite-native/trading-fixtures';
import {
    exchangeActions,
    selectAccountsWithTokensToSellSectionCondensedListByTradingType,
    tradingSlice,
} from '@suite-native/trading-state';
import { type ExchangeFormType, type MyAssetTradeable } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeSendAssetPicker } from '../ExchangeSendAssetPicker';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionCondensedListByTradingType: jest.fn(),
}));

const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionCondensedListByTradingType as unknown as jest.Mock;
const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('ExchangeSendAssetPicker', () => {
    let form: ExchangeFormType;
    let store: TestStore;

    const btcAccount = getBtcAccount();
    const ethAccount = getEthAccount();

    const defaultAssets: MyAssetTradeable[] = [
        {
            name: 'Bitcoin',
            symbol: 'btc',
            cryptoId: 'bitcoin' as CryptoId,
            balance: '1.23',
            fiatBalance: asBaseCurrencyAmount(new BigNumber(45.6)),
            isEnabled: true,
        },
    ];

    const defaultAccounts = [
        {
            key: 'account1',
            sectionData: btcAccount,
            data: defaultAssets,
        },
        {
            key: 'account2',
            sectionData: { ...ethAccount },
            data: [],
        },
    ];

    const getPreloadedState = () => ({
        device: deviceInitialState,
        featureFlags: {
            ...featureFlagsInitialState,
        },
        messageSystem: messageSystemInitialState,
        suiteSync: initialSuiteSyncState,
        suiteSyncData: initialSuiteSyncDataState,
        wallet: {
            trading: getInitializedTradingState(),
            accounts: [btcAccount, ethAccount],
        },
    });

    const renderExchangeForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), { services, store });

    const renderExchangeSendAssetPicker = () =>
        renderWithStoreProvider(<ExchangeSendAssetPicker />, {
            services,
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        reportMock.mockClear();
        const walletState = getWalletState({ tradeType: 'exchange' });
        store = createLightStore({
            reducer: {
                discreetMode: createStaticReducer({ isActive: false }),
                locale: localeReducer,
                device: createStaticReducer(deviceInitialState),
                featureFlags: createStaticReducer(featureFlagsInitialState),
                messageSystem: createStaticReducer(messageSystemInitialState),
                suiteSync: createStaticReducer(initialSuiteSyncState),
                suiteSyncData: createStaticReducer(initialSuiteSyncDataState),
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    accounts: createStaticReducer(walletState.accounts),
                    fiat: createStaticReducer(walletState.fiat),
                    send: createStaticReducer(walletState.send),
                    trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
                }),
            },
            preloadedState: getPreloadedState(),
        });
        const { result } = renderExchangeForm();
        form = result.current;

        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
    });

    it('should select asset on item press', async () => {
        const { getByText } = renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const asset = form.getValues('sendAsset');

        expect(asset).toEqual(
            expect.objectContaining({
                cryptoId: 'bitcoin',
            }),
        );
    });

    it('should select account on item press', async () => {
        const { getByText } = renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const accountForm = form.getValues('sendAccount');
        const accountKeyStore = store.getState().wallet.trading.exchange.tradingAccountKey;

        expect(accountForm).toEqual(btcAccount);
        expect(accountKeyStore).toBe(btcAccount.key);
    });

    it('should apply exchange send asset change effects on item press', async () => {
        form.setValue('sendCryptoAmount', '1');
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { getByText } = renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.sendAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoFrom',
            },
        });
    });

    it('should clear the receive asset and apply its change effects when it collides with the newly selected send asset', async () => {
        form.setValue('sendCryptoAmount', '1');
        form.setValue('receiveAsset', btcAsset);
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { getByText } = renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        expect(form.getValues('receiveAsset')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoTo',
            },
        });
    });

    it('should not apply receive asset change effects when there is no collision', async () => {
        form.setValue('sendCryptoAmount', '1');
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { getByText } = renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        expect(form.getValues('receiveAsset')).toBeUndefined();
        expect(dispatchSpy).not.toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(reportMock).not.toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoTo',
            },
        });
    });
});
