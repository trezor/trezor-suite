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
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { selectAccountsWithTokensToSellSectionListByTradingType } from '../../../../selectors/commonSelectors';
import { ExchangeFormType } from '../../../../types/exchange';
import { MyAsset } from '../../../../types/general';
import { ExchangeSendAssetPicker } from '../ExchangeSendAssetPicker';

jest.mock('../../../../selectors/commonSelectors', () => ({
    ...jest.requireActual('../../../../selectors/commonSelectors'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));
const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionListByTradingType as unknown as jest.Mock;

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
        wallet: {
            trading: getInitializedTradingState(),
            accounts: [btcAccount, ethAccount],
        },
    });

    const renderExchangeForm = () =>
        renderHookWithStoreProviderAsync(() => useExchangeForm(), { store });

    const renderExchangeSendAssetPicker = () =>
        renderWithStoreProviderAsync(<ExchangeSendAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        store = await initStore(getPreloadedState());
        const { result } = await renderExchangeForm();
        form = result.current;

        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
    });

    it('should select asset on item press', async () => {
        const { getByText } = await renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const asset = form.getValues('sendAsset');

        expect(asset).toEqual(
            expect.objectContaining({
                cryptoId: 'bitcoin',
            }),
        );
    });

    it('should select account on item press', async () => {
        const { getByText } = await renderExchangeSendAssetPicker();

        await userEvent.press(getByText('BTC'));

        const accountForm = form.getValues('sendAccount');
        const accountKeyStore = store.getState().wallet.trading.exchange.tradingAccountKey;

        expect(accountForm).toEqual(btcAccount);
        expect(accountKeyStore).toBe(btcAccount.key);
    });
});
