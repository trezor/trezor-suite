import { Image } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';

import { useProxyImage } from '#src/hooks/suite/useProxyImage';
import { type CustomNetworkCatalogueEntry } from '#src/utils/settings/customNetworks/customNetworkCatalogue';

const ICON_SIZE = 32;

type CustomNetworkIconProps = {
    entry: CustomNetworkCatalogueEntry;
};

// Loaded through the image proxy: the icon host is third-party, and the desktop app blocks it.
export const CustomNetworkIcon = ({ entry }: CustomNetworkIconProps) => {
    const { definition, iconUrl } = entry;
    const proxyImageQuery = useProxyImage(iconUrl);

    if (!proxyImageQuery.isSuccess) {
        return (
            <NetworkIcon
                size={ICON_SIZE}
                networkSymbol={definition.symbol}
                networkName={definition.name}
            />
        );
    }

    return (
        <Image
            imageSrc={proxyImageQuery.data}
            alt={definition.name}
            width={ICON_SIZE}
            height={ICON_SIZE}
            borderRadius="full"
        />
    );
};
