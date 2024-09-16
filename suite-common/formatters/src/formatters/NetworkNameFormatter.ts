import { getNetwork, NetworkSymbol } from '@suite-common/wallet-config';

import { makeFormatter } from '../makeFormatter';

export const NetworkNameFormatter = makeFormatter<NetworkSymbol, string>(
    value => getNetwork(value).name,
    'NetworkNameFormatter',
);
