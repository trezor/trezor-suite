import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { btcAsset, ethOnBaseAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { useTradingBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import { AssetNetworkInfo } from '../BuyAssetNetworkInfo';

describe('NetworkIconForToken', () => {
    let form: TradingBuyForm;

    const renderNetworkIconForToken = () =>
        renderWithBasicProvider(
            <Form form={form}>
                <AssetNetworkInfo />
            </Form>,
        );

    beforeEach(async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());
        form = result.current;
    });

    it('should render nothing when asset is not set', () => {
        const { toJSON } = renderNetworkIconForToken();

        expect(toJSON()).toBeNull();
    });

    it('should render empty box for networks that are not l2 networks = op, arb, base', () => {
        act(() => {
            form.setValue('asset', btcAsset);
        });
        const { queryByHintText, queryByLabelText } = renderNetworkIconForToken();

        expect(queryByHintText('Network Icon')).toBeNull();
        expect(queryByLabelText('Network name')).toBeNull();
    });

    it('should render network icon and name for l2 networks = op, arb, base and ETH as icon', () => {
        act(() => {
            form.setValue('asset', ethOnBaseAsset);
        });
        const { getByHintText, getByLabelText } = renderNetworkIconForToken();

        expect(getByHintText('Network Icon')).toBeTruthy();
        expect(getByLabelText('Network name')).toHaveTextContent('Base');
    });

    it('should render network icon and name for contracts', () => {
        act(() => {
            form.setValue('asset', usdcAsset);
        });
        const { getByHintText, getByLabelText } = renderNetworkIconForToken();

        expect(getByHintText('Network Icon')).toBeTruthy();
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
    });
});
