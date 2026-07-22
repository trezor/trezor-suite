import { type NetworkSymbol } from '@suite-common/networks';
import { getNetwork } from '@suite-common/wallet-config';

import { makeFormatter } from '../makeFormatter';

export const NetworkNameFormatter = makeFormatter<NetworkSymbol, string>(
    value => getNetwork(value).name,
    'NetworkNameFormatter',
);
