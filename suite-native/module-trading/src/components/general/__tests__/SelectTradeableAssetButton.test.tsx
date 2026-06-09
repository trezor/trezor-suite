import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { adaAsset } from '@suite-native/trading-fixtures';

import { SelectTradeableAssetButton } from '../SelectTradeableAssetButton';

describe('SelectTradeableAssetButton', () => {
    it('should render "Select asset" when no network is selected', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={undefined} caret />,
        );

        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));

        expect(button).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
    });

    it('should render TradeableAssetButton when network is selected', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={adaAsset} caret />,
        );
        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));
        expect(button).toHaveTextContent(/^ADA.$/);
    });

    it('should not display caret when caret prop is falsy', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={adaAsset} />,
        );
        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));
        expect(button).toHaveTextContent('ADA');
    });
});
