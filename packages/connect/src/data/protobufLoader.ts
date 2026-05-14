import { protobufManager } from '@trezor/protobuf';
import * as bitcoinProto from '@trezor/protobuf/src/definitions/messages-bitcoin_pb';
import * as bleProto from '@trezor/protobuf/src/definitions/messages-ble_pb';
import * as bootloaderProto from '@trezor/protobuf/src/definitions/messages-bootloader_pb';
import * as cardanoProto from '@trezor/protobuf/src/definitions/messages-cardano_pb';
import * as commonProto from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as cryptoProto from '@trezor/protobuf/src/definitions/messages-crypto_pb';
import * as debugProto from '@trezor/protobuf/src/definitions/messages-debug_pb';
import * as definitionsProto from '@trezor/protobuf/src/definitions/messages-definitions_pb';
import * as eosProto from '@trezor/protobuf/src/definitions/messages-eos_pb';
import * as ethereumEip712Proto from '@trezor/protobuf/src/definitions/messages-ethereum-eip712_pb';
import * as ethereumProto from '@trezor/protobuf/src/definitions/messages-ethereum_pb';
import * as evoluProto from '@trezor/protobuf/src/definitions/messages-evolu_pb';
import * as managementProto from '@trezor/protobuf/src/definitions/messages-management_pb';
import * as moneroProto from '@trezor/protobuf/src/definitions/messages-monero_pb';
import * as rippleProto from '@trezor/protobuf/src/definitions/messages-ripple_pb';
import * as solanaProto from '@trezor/protobuf/src/definitions/messages-solana_pb';
import * as stellarProto from '@trezor/protobuf/src/definitions/messages-stellar_pb';
import * as telemetryProto from '@trezor/protobuf/src/definitions/messages-telemetry_pb';
import * as tezosProto from '@trezor/protobuf/src/definitions/messages-tezos_pb';
import * as thpProto from '@trezor/protobuf/src/definitions/messages-thp_pb';
import * as tronProto from '@trezor/protobuf/src/definitions/messages-tron_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import * as optionsProto from '@trezor/protobuf/src/definitions/options_pb';

export const loadProtobufModules = () => {
    const definitionModules = [
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
    ];

    protobufManager.load(definitionModules);

    return Promise.resolve();
};
