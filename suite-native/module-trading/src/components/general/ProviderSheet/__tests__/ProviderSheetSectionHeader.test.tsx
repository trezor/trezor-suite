import { renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { type QuotesCategory } from '@suite-native/trading-types';

import {
    ProviderSheetSectionHeader,
    type ProviderSheetSectionHeaderProps,
} from '../ProviderSheetSectionHeader';

describe('ProviderSheetSectionHeader', () => {
    const renderProviderSheetSectionHeader = (props: ProviderSheetSectionHeaderProps) =>
        renderWithStoreProviderAsync(<ProviderSheetSectionHeader {...props} />);

    it.each<[QuotesCategory, string]>([
        ['fixed', 'Fixed-rate CEX'],
        ['float', 'Floating-rate CEX'],
        ['dex', 'DEX'],
    ])('should render correct section based on category [%s]', async (category, expectedTitle) => {
        const { getByText } = await renderProviderSheetSectionHeader({ category });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });
});
