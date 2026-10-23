import { type EthereumStakingProductAdapter } from '../types';
import { verifyEverstakeCalldata } from './everstakeCalldata';
import { EVERSTAKE_STAKING_LIMITS } from './everstakeConstants';
import { getEverstakeStepTarget } from './everstakeContracts';
import { validateEverstakeStepLiveState } from './everstakeLiveState';
import {
    buildEverstakeStep,
    planEverstakeOperation,
    previewEverstakeUnstake,
} from './everstakePlan';
import { deriveEverstakePosition } from './everstakePosition';
import { EVERSTAKE_TIMELINE_DEFAULTS, getEverstakeTimelines } from './everstakeTimelines';
import {
    classifyEverstakeCalldata,
    classifyEverstakeInternalTransfer,
    classifyEverstakeTransaction,
} from './everstakeTransactions';

export const everstakeAdapter: EthereumStakingProductAdapter = {
    networkType: 'ethereum',
    identityType: 'everstake-pool',
    limits: EVERSTAKE_STAKING_LIMITS,
    timelineDefaults: EVERSTAKE_TIMELINE_DEFAULTS,
    timelines: getEverstakeTimelines,
    derivePosition: deriveEverstakePosition,
    derivePositions: account => {
        const position = deriveEverstakePosition(account);

        return position ? [position] : [];
    },
    getStepTarget: getEverstakeStepTarget,
    buildStep: buildEverstakeStep,
    planOperation: planEverstakeOperation,
    verifyStep: ({ label, data }, source) => verifyEverstakeCalldata(label, data, source),
    validateLiveState: validateEverstakeStepLiveState,
    previewUnstake: previewEverstakeUnstake,
    classifyCalldata: classifyEverstakeCalldata,
    classifyTransaction: classifyEverstakeTransaction,
    classifyInternalTransfer: classifyEverstakeInternalTransfer,
};
