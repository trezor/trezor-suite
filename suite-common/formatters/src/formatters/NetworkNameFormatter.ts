import { NetworkSymbol } from '@suite-common/wallet-config';
import { getNetwork } from '@suite-common/wallet-utils';

import { makeFormatter } from '../makeFormatter';

export const NetworkNameFormatter = makeFormatter<NetworkSymbol, string>(
    value => getNetwork(value)?.name || value,
    'NetworkNameFormatter',
);
