import { useCoinLabel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

import { ProviderListSectionHeader } from './ProviderListSectionHeader';

export const DexSectionHeader = () => {
    const coinLabel = useCoinLabel();

    return (
        <ProviderListSectionHeader
            title={<Translation id="moduleTrading.providerSheet.dex.title" />}
            subtitle={
                <Translation
                    id="moduleTrading.providerSheet.dex.description"
                    values={{ coinLabel }}
                />
            }
        />
    );
};
