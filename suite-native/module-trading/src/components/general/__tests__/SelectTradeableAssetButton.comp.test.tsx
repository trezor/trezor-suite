import { render } from '@suite-native/test-utils';

import { SelectTradeableAssetButton } from '../SelectTradeableAssetButton';

describe('SelectTradeableAssetButton', () => {
    it('should render "Select coin" when no network is selected', () => {
        const { getByLabelText } = render(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={undefined} />,
        );

        const button = getByLabelText('Select coin');
        expect(button).toHaveTextContent(/^Select coin.$/);
    });

    it('should render TradeableAssetButton when network is selected', () => {
        const { getByLabelText } = render(
            <SelectTradeableAssetButton onPress={jest.fn()} selectedAsset={{ symbol: 'ada' }} />,
        );
        const button = getByLabelText('Select coin');
        expect(button).toHaveTextContent(/^ADA.$/);
    });

    it('should render asset name when specified in selectedAsset', () => {
        const { getByLabelText } = render(
            <SelectTradeableAssetButton
                onPress={jest.fn()}
                selectedAsset={{ symbol: 'eth', name: 'USDC' }}
            />,
        );

        const button = getByLabelText('Select coin');
        expect(button).toHaveTextContent(/^USDC.$/);
    });
});
