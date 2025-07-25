import { Translation } from '@suite-native/intl';

import { ProviderListSectionHeader } from './ProviderListSectionHeader';

export const DexSectionHeader = () => (
    <ProviderListSectionHeader
        title={<Translation id="moduleTrading.providerSheet.dex.title" />}
        subtitle={<Translation id="moduleTrading.providerSheet.dex.description" />}
    />
);
