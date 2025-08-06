import { renderWithBasicProvider } from '@suite-native/test-utils';

import { QuotesCategory } from '../../../../types/general';
import {
    ProviderSheetSectionHeader,
    ProviderSheetSectionHeaderProps,
} from '../ProviderSheetSectionHeader';

describe('ProviderSheetSectionHeader', () => {
    const renderProviderSheetSectionHeader = (props: ProviderSheetSectionHeaderProps) =>
        renderWithBasicProvider(<ProviderSheetSectionHeader {...props} />);

    it.each<[QuotesCategory, string]>([
        ['fixed', 'Fixed-rate CEX'],
        ['float', 'Floating-rate CEX'],
        ['dex', 'DEX'],
    ])('should render correct section based on category [%s]', (category, expectedTitle) => {
        const { getByText } = renderProviderSheetSectionHeader({ category });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });
});
