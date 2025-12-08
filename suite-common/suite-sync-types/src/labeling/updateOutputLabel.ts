import { SuiteSyncOwner } from '@suite-common/suite-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/connect';

import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

type UpdateOutputLabelParams = {
    deviceStaticSessionId: StaticSessionId;
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type UpdateOutputLabelDeps = {
    findSuiteSyncOwnerForDeviceStaticId: (staticId: StaticSessionId) => SuiteSyncOwner | null;
} & SuiteSyncStorageRepositoryDep;

export type UpdateOutputLabel = (params: UpdateOutputLabelParams) => void;

export type UpdateOutputLabelDep = { updateOutputLabel: UpdateOutputLabel };
