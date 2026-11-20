import { Translation } from '@suite-native/intl';

import { ProviderListSectionHeader } from './ProviderListSectionHeader';

export const FloatSectionHeader = () => (
    <ProviderListSectionHeader
        title={<Translation id="moduleTrading.providerSheet.float.titleOffers" />}
        subtitle={<Translation id="moduleTrading.providerSheet.float.description" />}
    />
);
