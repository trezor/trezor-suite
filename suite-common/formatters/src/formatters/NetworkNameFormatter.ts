import type { NetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { makeFormatter } from '../makeFormatter';

export const prepareNetworkNameFormatter = (deps: NetworkConfigDeps) =>
    makeFormatter<NetworkSymbol, string>(
        value => getNetwork(deps, value).name,
        'NetworkNameFormatter',
    );
