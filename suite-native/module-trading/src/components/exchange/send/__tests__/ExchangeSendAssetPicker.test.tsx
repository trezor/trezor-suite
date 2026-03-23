import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    type TestStore,
    initStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils';
import {
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { selectAccountsWithTokensToSellSectionCondensedListByTradingType } from '@suite-native/trading-state';
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
        wallet: {
            trading: getInitializedTradingState(),
            accounts: [btcAccount, ethAccount],
        },
    });

    const renderExchangeForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), { store });

    const renderExchangeSendAssetPicker = () =>
        renderWithStoreProvider(<ExchangeSendAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        store = initStore(getPreloadedState()).store;
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
