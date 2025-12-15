import { type QuotesCategory } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

import { CexFixedSectionHeader } from './CexFixedSectionHeader';
import { CexFloatSectionHeader } from './CexFloatSectionHeader';
import { DexSectionHeader } from './DexSectionHeader';

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
            return <DexSectionHeader />;
        default:
            return exhaustive(category);
    }
};
