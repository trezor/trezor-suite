import type { GetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { makeFormatter } from '../makeFormatter';

export const prepareNetworkNameFormatter = (deps: GetNetworkConfigDep) =>
    makeFormatter<NetworkSymbol, string>(
        value => deps.getNetworkConfig(value).name,
        'NetworkNameFormatter',
    );
