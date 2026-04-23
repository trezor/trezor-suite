import { combineReducers } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
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
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
    getWalletState,
} from '@suite-native/trading-fixtures';
import {
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
            [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
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
        renderHookWithStoreProvider(() => useExchangeForm(), {
            store,
            providers: ['intl', 'formatter', 'navigation'],
        });

    const renderExchangeSendAssetPicker = () =>
        renderWithStoreProvider(<ExchangeSendAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            providers: ['intl', 'formatter', 'navigation'],
        });

    beforeEach(() => {
        const walletState = getWalletState({ tradeType: 'exchange' });
        store = createLightStore({
            reducer: {
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
});
