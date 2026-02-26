import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import {
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { selectAccountsWithTokensToSellSectionCondensedListByTradingType } from '@suite-native/trading-state';
import { MyAssetTradeable, SellFormType } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

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

    const getPreloadedState = () => ({
        wallet: {
            trading: getInitializedTradingState(),
            accounts: [btcAccount, ethAccount],
        },
    });

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const renderSellSendAssetPicker = () =>
        renderWithStoreProviderAsync(<SellSendAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        store = initStore(getPreloadedState()).store;
        const { result } = await renderSellForm();
        form = result.current;

        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
    });

    it('should select asset on item press', async () => {
        const { getByText } = await renderSellSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const asset = form.getValues('sendAsset');

        expect(asset).toEqual(
            expect.objectContaining({
                cryptoId: 'bitcoin',
            }),
        );
    });

    it('should select account on item press', async () => {
        const { getByText } = await renderSellSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const accountKeyStore = store.getState().wallet.trading.sell.tradingAccountKey;
        expect(accountKeyStore).toBe(btcAccount.key);
    });
});
