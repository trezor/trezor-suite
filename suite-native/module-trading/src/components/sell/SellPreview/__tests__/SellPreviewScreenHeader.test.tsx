import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { SellPreviewScreenHeader } from '../SellPreviewScreenHeader';

describe('SellPreviewScreenHeader', () => {
    const renderSellPreviewScreenHeader = () =>
        renderWithStoreProviderAsync(<SellPreviewScreenHeader />);

    it('should render screen header with correct title', async () => {
        const { getByText } = await renderSellPreviewScreenHeader();

        expect(getByText('Sell')).toBeOnTheScreen();
    });
});
