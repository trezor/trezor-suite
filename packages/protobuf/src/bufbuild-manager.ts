import * as bitcoinProto from './definitions/messages-bitcoin_pb';
import * as bleProto from './definitions/messages-ble_pb';
import * as bootloaderProto from './definitions/messages-bootloader_pb';
import * as cardanoProto from './definitions/messages-cardano_pb';
import * as commonProto from './definitions/messages-common_pb';
import * as cryptoProto from './definitions/messages-crypto_pb';
import * as debugProto from './definitions/messages-debug_pb';
import * as definitionsProto from './definitions/messages-definitions_pb';
import * as eosProto from './definitions/messages-eos_pb';
import * as ethereumEip712Proto from './definitions/messages-ethereum-eip712_pb';
import * as ethereumProto from './definitions/messages-ethereum_pb';
import * as evoluProto from './definitions/messages-evolu_pb';
import * as managementProto from './definitions/messages-management_pb';
import * as moneroProto from './definitions/messages-monero_pb';
import * as rippleProto from './definitions/messages-ripple_pb';
import * as solanaProto from './definitions/messages-solana_pb';
import * as stellarProto from './definitions/messages-stellar_pb';
import * as telemetryProto from './definitions/messages-telemetry_pb';
import * as tezosProto from './definitions/messages-tezos_pb';
import * as thpProto from './definitions/messages-thp_pb';
import * as tronProto from './definitions/messages-tron_pb';
import * as messagesProto from './definitions/messages_pb';
import * as optionsProto from './definitions/options_pb';
import { ProtobufManager } from './manager';

const bufbuildDebugEnvValue =
    typeof process !== 'undefined' && typeof process.env !== 'undefined'
        ? process.env.BUFBUILD_DEBUG
        : undefined;

export const isBufbuildDebugEnabled =
    bufbuildDebugEnvValue !== '0' && bufbuildDebugEnvValue !== 'false';

const bufbuildManager = isBufbuildDebugEnabled ? ProtobufManager() : undefined;
bufbuildManager?.load([
    bitcoinProto,
    bleProto,
    bootloaderProto,
    cardanoProto,
    commonProto,
    cryptoProto,
    debugProto,
    definitionsProto,
    eosProto,
    ethereumEip712Proto,
    ethereumProto,
    evoluProto,
    managementProto,
    moneroProto,
    rippleProto,
    solanaProto,
    stellarProto,
    telemetryProto,
    tezosProto,
    thpProto,
    tronProto,
    messagesProto,
    optionsProto,
]);

export { bufbuildManager };
