import { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Form } from '@suite-native/forms';
import {
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';
import { BigNumber } from '@trezor/utils';

import { getBtcAccount, getEthAccount } from '../../../../__fixtures__/account';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { selectAccountsWithTokensToSellSectionListByTradingType } from '../../../../selectors/commonSelectors';
import { MyAsset } from '../../../../types/general';
import { SellFormType } from '../../../../types/sell';
import { SellSendAssetPicker } from '../SellSendAssetPicker';

jest.mock('../../../../selectors/commonSelectors', () => ({
    ...jest.requireActual('../../../../selectors/commonSelectors'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));
const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionListByTradingType as unknown as jest.Mock;

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
        store = await initStore(getPreloadedState());
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
