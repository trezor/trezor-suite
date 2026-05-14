import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SellPreviewScreenHeader } from '../SellPreviewScreenHeader';

describe('SellPreviewScreenHeader', () => {
    const renderSellPreviewScreenHeader = () =>
        renderWithStoreProvider(<SellPreviewScreenHeader />);

    it('should render screen header with correct title', () => {
        const { getByText } = renderSellPreviewScreenHeader();

        expect(getByText('Sell')).toBeOnTheScreen();
    });
});
