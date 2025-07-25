import { Translation } from '@suite-native/intl';

import { ProviderListSectionHeader } from './ProviderListSectionHeader';

export const CexFloatSectionHeader = () => (
    <ProviderListSectionHeader
        title={<Translation id="moduleTrading.providerSheet.float.title" />}
        subtitle={<Translation id="moduleTrading.providerSheet.float.description" />}
    />
);
