import { type TxSimulationAction } from '@suite-common/wallet-types';

export const TX_METHODS_WITH_FEES = ['ethereumSignTransaction'] as const satisfies ReadonlyArray<
    TxSimulationAction['method']
>;
