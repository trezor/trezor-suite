import { NetworkSymbol } from '@suite-common/wallet-config';
import { getNetworkCompatible } from '@suite-common/wallet-utils';

import { makeFormatter } from '../makeFormatter';

export const NetworkNameFormatter = makeFormatter<NetworkSymbol, string>(
    value => getNetworkCompatible(value)?.name || value,
    'NetworkNameFormatter',
);
