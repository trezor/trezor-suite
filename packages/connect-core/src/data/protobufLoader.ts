import { protobufManager } from '@trezor/protobuf';
import bitcoinProto from '@trezor/protobuf/src/definitions/messages-bitcoin_dict';
import bleProto from '@trezor/protobuf/src/definitions/messages-ble_dict';
import bootloaderProto from '@trezor/protobuf/src/definitions/messages-bootloader_dict';
import cardanoProto from '@trezor/protobuf/src/definitions/messages-cardano_dict';
import commonProto from '@trezor/protobuf/src/definitions/messages-common_dict';
import cryptoProto from '@trezor/protobuf/src/definitions/messages-crypto_dict';
import definitionsProto from '@trezor/protobuf/src/definitions/messages-definitions_dict';
import eosProto from '@trezor/protobuf/src/definitions/messages-eos_dict';
import ethereumEip712Proto from '@trezor/protobuf/src/definitions/messages-ethereum-eip712_dict';
import ethereumProto from '@trezor/protobuf/src/definitions/messages-ethereum_dict';
import evoluProto from '@trezor/protobuf/src/definitions/messages-evolu_dict';
import managementProto from '@trezor/protobuf/src/definitions/messages-management_dict';
import moneroProto from '@trezor/protobuf/src/definitions/messages-monero_dict';
import nostrProto from '@trezor/protobuf/src/definitions/messages-nostr_dict';
import rippleProto from '@trezor/protobuf/src/definitions/messages-ripple_dict';
import solanaProto from '@trezor/protobuf/src/definitions/messages-solana_dict';
import stellarProto from '@trezor/protobuf/src/definitions/messages-stellar_dict';
import telemetryProto from '@trezor/protobuf/src/definitions/messages-telemetry_dict';
import tezosProto from '@trezor/protobuf/src/definitions/messages-tezos_dict';
import thpProto from '@trezor/protobuf/src/definitions/messages-thp_dict';
import tronProto from '@trezor/protobuf/src/definitions/messages-tron_dict';
import optionsProto from '@trezor/protobuf/src/definitions/options_dict';

export const loadProtobufModules = () => {
    const definitionModules = [
        bitcoinProto,
        bleProto,
        bootloaderProto,
        cardanoProto,
        commonProto,
        cryptoProto,
        definitionsProto,
        eosProto,
        ethereumEip712Proto,
        ethereumProto,
        evoluProto,
        managementProto,
        moneroProto,
        nostrProto,
        rippleProto,
        solanaProto,
        stellarProto,
        telemetryProto,
        tezosProto,
        thpProto,
        tronProto,
        optionsProto,
    ];

    protobufManager.load(definitionModules);

    return Promise.resolve();
};
