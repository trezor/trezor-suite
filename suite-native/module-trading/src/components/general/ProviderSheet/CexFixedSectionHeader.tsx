import { Translation } from '@suite-native/intl';

import { ProviderListSectionHeader } from './ProviderListSectionHeader';

export const CexFixedSectionHeader = () => (
    <ProviderListSectionHeader
        title={<Translation id="moduleTrading.providerSheet.fixed.title" />}
        subtitle={<Translation id="moduleTrading.providerSheet.fixed.description" />}
    />
);
