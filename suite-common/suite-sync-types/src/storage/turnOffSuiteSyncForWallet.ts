import { SuiteSyncOwner } from '@suite-common/suite-types';

export type TurnOffSuiteSyncForWallet = (params: {
    owner: SuiteSyncOwner | undefined;
}) => Promise<void>;

export type TurnOffSuiteSyncForWalletDep = {
    turnOffSuiteSyncForWallet: TurnOffSuiteSyncForWallet;
};
