import { createTransform } from 'redux-persist';

import { type Explorer } from '@suite-common/wallet-config';
import { type ExplorerItem } from '@suite-common/wallet-core';

export const explorerPersistTransform = createTransform<
    Pick<ExplorerItem, 'custom'>,
    Explorer | undefined
>(
    inboundState => inboundState.custom,
    outboundState => ({ custom: outboundState }),
);
