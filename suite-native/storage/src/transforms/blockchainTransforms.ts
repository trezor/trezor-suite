import { createTransform } from 'redux-persist';

import { type Blockchain } from '@suite-common/wallet-types';

export const blockchainPersistTransform = createTransform<
    Blockchain,
    Pick<Blockchain, 'backends'> | undefined
>(
    ({ backends }) => (backends && Object.keys(backends).length > 0 ? { backends } : undefined),
    outboundState => ({
        connected: false,
        blockHash: '0',
        blockHeight: 0,
        version: '0',
        backends: outboundState ? outboundState.backends : {},
    }),
);
