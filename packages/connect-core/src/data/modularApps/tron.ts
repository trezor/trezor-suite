import tronArtifacts from '@trezor/connect-data/files/modularApps/tron.json';

import { createArtifactLoader } from '../../device/modularApp/modularAppArtifacts';
import type { ModularAppDefinition } from '../../device/modularApp/types';

// App-local ids from sdk/apps/tron/protob/messages.proto.
const TRON_MESSAGE_IDS: ModularAppDefinition['messageIds'] = {
    TronGetAddress: 0,
    TronAddress: 1,
    TronSignTx: 2,
    TronSignature: 3,
    TronContractRequest: 4,
    TronTransferContract: 5,
    TronTriggerSmartContract: 6,
    TronFreezeBalanceV2Contract: 7,
    TronUnfreezeBalanceV2Contract: 8,
    TronWithdrawUnfreeze: 9,
    TronVoteWitnessContract: 10,
    TronWithdrawBalance: 11,
};

// The bundled artifacts are an emulator build (trezor-firmware bieleluk/sdk-wip, CI run
// 35578205255, extapp-emu-tron-t3w1-en). Replace them with the device `.tapp` for T3W1 hardware.
// This ring-0 build does not require a proof.
export const TRON_MODULAR_APP: ModularAppDefinition = {
    id: 'tron.trezor.com',
    messageIds: TRON_MESSAGE_IDS,
    loadArtifacts: createArtifactLoader('tron.json', tronArtifacts),
};
