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
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
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
    selectAccountsWithTokensToSellSectionListByTradingType,
    tradingSlice,
} from '@suite-native/trading-state';
import { type ExchangeFormType, type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { ExchangeSendAssetPicker } from './ExchangeSendAssetPicker';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));

const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionListByTradingType as unknown as jest.Mock;
const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
let mockSelectedMyAssetAccountKey: string | undefined;
let mockSelectedMyAssetCryptoId: string | undefined;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate, setParams: mockSetParams }),
    useRoute: () => ({
        params: {
            tradingType: 'exchange',
            selectedMyAssetAccountKey: mockSelectedMyAssetAccountKey,
            selectedMyAssetCryptoId: mockSelectedMyAssetCryptoId,
        },
    }),
}));

describe('ExchangeSendAssetPicker', () => {
    let form: ExchangeFormType;
    let store: TestStore;

    const btcAccount = getBtcAccount();
    const ethAccount = getEthAccount();

    const defaultAssets: MyAsset[] = [
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

    const renderExchangeForm = async () =>
        await renderHookWithStoreProvider(() => useExchangeForm(), { services, store });

    const renderExchangeSendAssetPicker = async () =>
        await renderWithStoreProvider(<ExchangeSendAssetPicker />, {
            services,
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        jest.clearAllMocks();
        mockSelectedMyAssetAccountKey = undefined;
        mockSelectedMyAssetCryptoId = undefined;
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
        const { result } = await renderExchangeForm();
        form = result.current;

        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
    });

    it('should navigate to the my asset screen', async () => {
        const { getByLabelText } = await renderExchangeSendAssetPicker();

        await fireEvent.press(getByLabelText('Select asset'));

        expect(mockNavigate).toHaveBeenCalledWith('TradingMyAsset', {
            tradingType: 'exchange',
        });
    });

    it('should select asset returned from the screen', async () => {
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        await renderExchangeSendAssetPicker();

        const asset = form.getValues('sendAsset');

        expect(asset).toEqual(
            expect.objectContaining({
                cryptoId: 'bitcoin',
            }),
        );
    });

    it('should select account returned from the screen', async () => {
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        await renderExchangeSendAssetPicker();

        const accountForm = form.getValues('sendAccount');
        const accountKeyStore = store.getState().wallet.trading.exchange.tradingAccountKey;

        expect(accountForm).toEqual(btcAccount);
        expect(accountKeyStore).toBe(btcAccount.key);
    });

    it('should apply exchange send asset change effects for an asset returned from the screen', async () => {
        form.setValue('sendCryptoAmount', '1');
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        await renderExchangeSendAssetPicker();

        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.sendAssetChanged());
        expect(mockSetParams).toHaveBeenCalledWith({
            selectedMyAssetAccountKey: undefined,
            selectedMyAssetCryptoId: undefined,
        });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoFrom',
            },
        });
    });

    it('should clear the receive asset and apply its change effects on collision', async () => {
        form.setValue('sendCryptoAmount', '1');
        form.setValue('receiveAsset', btcAsset);
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        await renderExchangeSendAssetPicker();

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
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        await renderExchangeSendAssetPicker();

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
