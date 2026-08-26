import { type QuotesCategory } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

import { CexFixedSectionHeader } from './CexFixedSectionHeader';
import { CexFloatSectionHeader } from './CexFloatSectionHeader';

export type ProviderSheetSectionHeaderProps = {
    category: QuotesCategory;
};

export const ProviderSheetSectionHeader = ({ category }: ProviderSheetSectionHeaderProps) => {
    switch (category) {
        case 'fixed':
            return <CexFixedSectionHeader />;
        case 'float':
            return <CexFloatSectionHeader />;
        case 'dex':
            throw new Error(
                'DEX section header should not be rendered as DEX quotes are shown inside fixed/float rate sections',
            );
        default:
            return exhaustive(category);
    }
};
