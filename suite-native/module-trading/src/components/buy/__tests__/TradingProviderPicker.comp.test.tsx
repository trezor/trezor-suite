import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingProviderPicker } from '../TradingProviderPicker';

describe('TradingProviderPicker', () => {
    const renderTradingProviderPicker = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return renderWithStoreProviderAsync(<TradingProviderPicker form={result.current} />);
    };

    it('should display "Not selected" when in default state', async () => {
        const { getByLabelText } = await renderTradingProviderPicker();
        expect(getByLabelText('No provider selected')).toHaveTextContent('Not selected');
    });
});
