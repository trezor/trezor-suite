import { type QuotesCategory } from '@suite-native/trading-types';

import {
    ProviderSheetSectionHeader,
    type ProviderSheetSectionHeaderProps,
} from './ProviderSheetSectionHeader';
import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';

describe('ProviderSheetSectionHeader', () => {
    const renderProviderSheetSectionHeader = (props: ProviderSheetSectionHeaderProps) =>
        renderWithTradingProvider(<ProviderSheetSectionHeader {...props} />);

    it.each<[QuotesCategory, string]>([
        ['fixed', 'Fixed-rate CEX'],
        ['float', 'Floating-rate CEX'],
        ['dex', 'DEX'],
    ])('should render correct section based on category [%s]', (category, expectedTitle) => {
        const { getByText } = renderProviderSheetSectionHeader({ category });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });
});
