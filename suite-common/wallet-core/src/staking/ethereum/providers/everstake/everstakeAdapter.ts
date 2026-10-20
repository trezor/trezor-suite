import { type EthereumStakingProviderAdapter } from '../types';
import { verifyEverstakeCalldata } from './everstakeCalldata';
import { EVERSTAKE_STAKING_LIMITS } from './everstakeConstants';
import { validateEverstakeStepLiveState } from './everstakeLiveState';
import {
    buildEverstakeStep,
    planEverstakeOperation,
    previewEverstakeUnstake,
} from './everstakePlan';
import { deriveEverstakePosition } from './everstakePosition';

export const everstakeAdapter: EthereumStakingProviderAdapter = {
    id: 'everstake',
    limits: EVERSTAKE_STAKING_LIMITS,
    contributesToNativeBalance: true,
    derivePosition: deriveEverstakePosition,
    buildStep: buildEverstakeStep,
    planOperation: planEverstakeOperation,
    verifyStep: ({ label, data }, source) => verifyEverstakeCalldata(label, data, source),
    validateLiveState: validateEverstakeStepLiveState,
    previewUnstake: previewEverstakeUnstake,
};
