import type { CryptoId } from 'invity-api';

import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import {
    type TestStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import {
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import {
    selectAccountsWithTokensToSellSectionListByTradingType,
    sellActions,
} from '@suite-native/trading-state';
import { type MyAsset, type SellFormType } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { SellSendAssetPicker } from './SellSendAssetPicker';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { createTradingLightStore } from '../../../test-utils/tradingTestUtils';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));
const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionListByTradingType as unknown as jest.Mock;
const reportMock = jest.fn();
const services: NativeAnalyticsDep & NetworkModuleRepositoryDep = {
    analytics: mockNativeAnalytics(reportMock),
    networkModuleRepository: mockNetworkModuleRepository(),
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
            tradingType: 'sell',
            selectedMyAssetAccountKey: mockSelectedMyAssetAccountKey,
            selectedMyAssetCryptoId: mockSelectedMyAssetCryptoId,
        },
    }),
}));

describe('SellSendAssetPicker', () => {
    let form: SellFormType;
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

    const renderSellForm = async () =>
        await renderHookWithStoreProvider(() => useSellForm(), { services, store });

    const renderSellSendAssetPicker = async () =>
        await renderWithStoreProvider(<SellSendAssetPicker />, {
            services,
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        reportMock.mockClear();
        jest.clearAllMocks();
        mockSelectedMyAssetAccountKey = undefined;
        mockSelectedMyAssetCryptoId = undefined;
        store = createTradingLightStore({
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: getInitializedTradingState(),
                    accounts: [btcAccount, ethAccount],
                },
            },
        });
        const { result } = await renderSellForm();
        form = result.current;

        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
    });

    it('should navigate to the my asset screen', async () => {
        const { getByLabelText } = await renderSellSendAssetPicker();

        await userEvent.press(getByLabelText('Select asset'));

        expect(mockNavigate).toHaveBeenCalledWith('TradingMyAsset', { tradingType: 'sell' });
    });

    it('should select asset returned from the screen', async () => {
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        await renderSellSendAssetPicker();

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
        await renderSellSendAssetPicker();

        const accountKeyStore = store.getState().wallet.trading.sell.tradingAccountKey;
        expect(accountKeyStore).toBe(btcAccount.key);
    });

    it('should select the exact account when the same asset is present in multiple accounts', async () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue([
            defaultAccounts[0],
            {
                key: 'account2',
                sectionData: ethAccount,
                data: defaultAssets,
            },
        ]);
        mockSelectedMyAssetAccountKey = ethAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';

        await renderSellSendAssetPicker();

        expect(store.getState().wallet.trading.sell.tradingAccountKey).toBe(ethAccount.key);
    });

    it('should leave the form unchanged when the screen is closed without a selection', async () => {
        await renderSellSendAssetPicker();

        expect(form.getValues('sendAsset')).toBeUndefined();
        expect(mockSetParams).not.toHaveBeenCalled();
    });

    it('should apply sell asset change effects for an asset returned from the screen', async () => {
        form.setValue('cryptoStringAmount', '1');
        mockSelectedMyAssetAccountKey = btcAccount.key;
        mockSelectedMyAssetCryptoId = 'bitcoin';
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        await renderSellSendAssetPicker();

        expect(form.getValues('cryptoStringAmount')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(sellActions.sendAssetChanged());
        expect(mockSetParams).toHaveBeenCalledWith({
            selectedMyAssetAccountKey: undefined,
            selectedMyAssetCryptoId: undefined,
        });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'sell',
                parameter: 'cryptoFrom',
            },
        });
    });
});
