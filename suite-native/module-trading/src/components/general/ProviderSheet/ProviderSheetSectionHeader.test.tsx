import { getTranslation } from '@suite-native/intl';
import { type QuotesCategory } from '@suite-native/trading-types';

import {
    ProviderSheetSectionHeader,
    type ProviderSheetSectionHeaderProps,
} from './ProviderSheetSectionHeader';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('ProviderSheetSectionHeader', () => {
    const renderProviderSheetSectionHeader = async (props: ProviderSheetSectionHeaderProps) =>
        await renderWithTradingProvider(<ProviderSheetSectionHeader {...props} />);

    it.each<[QuotesCategory, string]>([
        ['fixed', getTranslation('moduleTrading.providerSheet.fixed.titleOffers')],
        ['float', getTranslation('moduleTrading.providerSheet.float.titleOffers')],
    ])('should render correct section based on category [%s]', async (category, expectedTitle) => {
        const { getByText } = await renderProviderSheetSectionHeader({ category });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });

    it('should throw when category is dex', () => {
        expect(() => renderProviderSheetSectionHeader({ category: 'dex' })).toThrow(
            'DEX section header should not be rendered as DEX quotes are shown inside fixed/float rate sections',
        );
    });
});
