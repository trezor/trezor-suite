import { getTranslation } from '@suite-native/intl';
import { act, renderWithBasicProvider } from '@suite-native/test-utils';
import { adaAsset } from '@suite-native/trading-fixtures';

import {
    SelectTradeableAssetButton,
    type SelectTradeableAssetButtonProps,
} from '../SelectTradeableAssetButton';

describe('SelectTradeableAssetButton', () => {
    const renderButton = async (initialProps: Partial<SelectTradeableAssetButtonProps>) => {
        const res = renderWithBasicProvider(
            <SelectTradeableAssetButton
                onPress={jest.fn()}
                selectedAsset={undefined}
                {...initialProps}
            />,
        );
        await act(async () => {
            await act(() => Promise.resolve());
        });

        return res;
    };
    it('should render "Select asset" when no network is selected', async () => {
        const { getByLabelText } = await renderButton({ selectedAsset: undefined });

        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));

        expect(button).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
    });

    it('should render TradeableAssetButton when network is selected', async () => {
        const { getByLabelText } = await renderButton({ selectedAsset: adaAsset, caret: true });
        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));
        expect(button).toHaveTextContent(/^ADA.$/);
    });

    it('should not display caret when caret prop is falsy', async () => {
        const { getByLabelText } = await renderButton({ selectedAsset: adaAsset, caret: false });
        const button = getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle'));
        expect(button).toHaveTextContent('ADA');
    });
});
