import { renderWithBasicProvider } from '@suite-native/test-utils';

import { adaAsset } from '../../../__fixtures__/tradeableAssets';
import { SelectTradeableAssetButton } from '../SelectTradeableAssetButton';

describe('SelectTradeableAssetButton', () => {
    it('should render "Select coin" when no network is selected', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={undefined} />,
        );

        const button = getByLabelText('Select coin');
        expect(button).toHaveTextContent(/^Select coin.$/);
    });

    it('should render TradeableAssetButton when network is selected', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={adaAsset} />,
        );
        const button = getByLabelText('Select coin');
        expect(button).toHaveTextContent(/^ADA.$/);
    });
});
