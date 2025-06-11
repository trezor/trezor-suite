import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormType } from '../../../types/buy';
import { ReceiveAccount, TradeableAsset } from '../../../types/general';
import { BuyReceiveAccountPicker } from '../BuyReceiveAccountPicker';

const btcAccountName1 = 'BTC Account #1';
const btcAddressAddress = '1BTC';

const getBuyState = (selectedReceiveAccount: ReceiveAccount | undefined) => ({
    wallet: {
        tradingNew: {
            buy: {
                selectedReceiveAccount,
            },
        },
    },
});

describe('BuyReceiveAccountPicker', () => {
    let buyForm: BuyFormType;

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm());

        return result.current;
    };

    const renderPicker = ({ preloadedState }: { preloadedState?: PreloadedState } = {}) =>
        renderWithStoreProviderAsync(<BuyReceiveAccountPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={buyForm}>{children}</Form>,
        });

    const setSelectedAsset = (asset: TradeableAsset) => {
        act(() => {
            buyForm.setValue('asset', asset);
        });
    };

    beforeEach(async () => {
        buyForm = await renderBuyForm();
    });

    it('should display nothing when selectedSymbol is not specified', async () => {
        const { toJSON } = await renderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display "Not selected" when asset is not specified', async () => {
        setSelectedAsset(btcAsset);
        const { getByText } = await renderPicker();

        expect(getByText('Not selected')).toBeTruthy();
    });

    it('should display selected account name and address', async () => {
        setSelectedAsset(btcAsset);
        const btcAccount = getBtcAccount();
        const { getByText } = await renderPicker({
            preloadedState: getBuyState({
                account: btcAccount,
                address: btcAccount.addresses?.used[0],
            }),
        });

        expect(getByText(btcAccountName1)).toBeTruthy();
        expect(getByText(btcAddressAddress)).toBeTruthy();
    });
});
