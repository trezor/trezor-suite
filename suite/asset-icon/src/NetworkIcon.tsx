import { useTheme } from 'styled-components';

import { useServices } from '@suite-common/dependency-injection';
import { injectNetworkIconRegistry } from '@suite-common/networks';
import {
    NetworkIcon as NetworkIconComponent,
    type NetworkIconProps,
} from '@trezor/product-components';

import { getNetworkBadgeProps } from './assetIconUtils';

type NetworkIconWrapperProps = Omit<NetworkIconProps, 'src' | 'color' | 'backgroundColor'> & {
    networkSymbol: string;
};

export const NetworkIcon = ({ networkSymbol, ...props }: NetworkIconWrapperProps) => {
    const { networkIconRegistry } = useServices(injectNetworkIconRegistry);
    const theme = useTheme();
    const data = networkIconRegistry.getNetworkIcon(networkSymbol);

    return data ? (
        <NetworkIconComponent {...props} {...getNetworkBadgeProps(data.badge, theme)} />
    ) : null;
};
