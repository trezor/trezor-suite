import { createAction } from '@reduxjs/toolkit';

import { Explorer, NetworkSymbol } from '@suite-common/wallet-config';

export const EXPLORER_MODULE_PREFIX = '@common/wallet-core/explorer';

const setExplorer = createAction(
    `${EXPLORER_MODULE_PREFIX}/setExplorer`,
    (payload: { symbol: NetworkSymbol; explorer?: Explorer }) => ({
        payload,
    }),
);

export const explorerActions = {
    setExplorer,
};
