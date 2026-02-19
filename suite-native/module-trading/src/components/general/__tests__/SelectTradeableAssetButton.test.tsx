import { renderWithBasicProvider } from '@suite-native/test-utils';
import { adaAsset } from '@suite-native/trading-fixtures';

import { SelectTradeableAssetButton } from '../SelectTradeableAssetButton';

describe('SelectTradeableAssetButton', () => {
    it('should render "Select asset" when no network is selected', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={undefined} caret />,
        );

        const button = getByLabelText('Select asset');
        expect(button).toHaveTextContent(/^Select asset.$/);
    });

    it('should render TradeableAssetButton when network is selected', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={adaAsset} caret />,
        );
        const button = getByLabelText('Select asset');
        expect(button).toHaveTextContent(/^ADA.$/);
    });

    it('should not display caret when caret prop is falsy', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={adaAsset} />,
        );
        const button = getByLabelText('Select asset');
        expect(button).toHaveTextContent('ADA');
    });
});
