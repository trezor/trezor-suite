import { useTheme } from 'styled-components';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkIconRegistry } from '@suite-common/networks';
import {
    NetworkIcon as NetworkIconComponent,
    type NetworkIconProps,
} from '@trezor/product-components';

import { getNetworkBadgeProps } from './assetIconUtils';

export const NetworkIcon = ({
    networkSymbol,
    ...props
}: Omit<NetworkIconProps, 'src' | 'color' | 'backgroundColor'> & { networkSymbol: string }) => {
    const { networkIconRegistry } = useServices(selectNetworkIconRegistry);
    const theme = useTheme();
    const data = networkIconRegistry.getNetworkIcon(networkSymbol);

    return data ? (
        <NetworkIconComponent {...props} {...getNetworkBadgeProps(data.badge, theme)} />
    ) : null;
};
