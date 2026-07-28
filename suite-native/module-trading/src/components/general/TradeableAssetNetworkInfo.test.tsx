import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { btcAsset, ethOnBaseAsset, usdcAsset } from '@suite-native/trading-fixtures';

import {
    TradeableAssetNetworkInfo,
    type TradeableAssetNetworkInfoProps,
} from './TradeableAssetNetworkInfo';

describe('TradeableAssetNetworkInfo', () => {
    const renderTradeableAssetNetworkInfo = (asset: TradeableAssetNetworkInfoProps['asset']) =>
        renderWithBasicProvider(<TradeableAssetNetworkInfo asset={asset} />);

    it('should render nothing when asset is not set', () => {
        const { toJSON } = renderTradeableAssetNetworkInfo(undefined);

        expect(toJSON()).toBeNull();
    });

    it('should render empty box for networks that are not l2 networks = op, arb, base', () => {
        const { queryByHintText, queryByLabelText } = renderTradeableAssetNetworkInfo(btcAsset);

        expect(queryByHintText('Network Icon')).toBeNull();
        expect(queryByLabelText(getTranslation('moduleTrading.networkName'))).toBeNull();
    });

    it('should render network icon and name for l2 networks = op, arb, base and ETH as icon', () => {
        const { getByHintText, getByLabelText } = renderTradeableAssetNetworkInfo(ethOnBaseAsset);

        expect(getByHintText('Network Icon')).toBeTruthy();
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Base',
        );
    });

    it('should render network icon and name for contracts', () => {
        const { getByHintText, getByLabelText } = renderTradeableAssetNetworkInfo(usdcAsset);

        expect(getByHintText('Network Icon')).toBeTruthy();
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
    });
});
