import { createTransform } from 'redux-persist';

import { type Blockchain } from '@suite-common/wallet-types';

export const blockchainPersistTransform = createTransform<Blockchain, Pick<Blockchain, 'backends'>>(
    inboundState => ({ backends: inboundState.backends }),
    outboundState => ({
        connected: false,
        blockHash: '0',
        blockHeight: 0,
        version: '0',
        backends: outboundState.backends,
    }),
    { whitelist: ['btc'] },
);
