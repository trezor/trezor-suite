import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
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
import { selectAccountsWithTokensToSellSectionCondensedListByTradingType } from '@suite-native/trading-state';
import { type MyAssetTradeable, type SellFormType } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { createTradingLightStore } from '../../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellSendAssetPicker } from '../SellSendAssetPicker';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionCondensedListByTradingType: jest.fn(),
}));
const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionCondensedListByTradingType as unknown as jest.Mock;

describe('SellSendAssetPicker', () => {
    let form: SellFormType;
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

    const renderSellForm = () =>
        renderHookWithStoreProvider(() => useSellForm(), {
            store,
            providers: ['intl', 'formatter', 'navigation'],
        });

    const renderSellSendAssetPicker = () =>
        renderWithStoreProvider(<SellSendAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            providers: ['intl', 'formatter', 'navigation'],
        });

    beforeEach(() => {
        store = createTradingLightStore({
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: getInitializedTradingState(),
                    accounts: [btcAccount, ethAccount],
                },
            },
        });
        const { result } = renderSellForm();
        form = result.current;

        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
    });

    it('should select asset on item press', async () => {
        const { getByText } = renderSellSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const asset = form.getValues('sendAsset');

        expect(asset).toEqual(
            expect.objectContaining({
                cryptoId: 'bitcoin',
            }),
        );
    });

    it('should select account on item press', async () => {
        const { getByText } = renderSellSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const accountKeyStore = store.getState().wallet.trading.sell.tradingAccountKey;
        expect(accountKeyStore).toBe(btcAccount.key);
    });
});
