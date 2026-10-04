import { protobufManager } from '@trezor/protobuf';
import * as bitcoinDefinitions from '@trezor/protobuf/src/definitions/messages-bitcoin_pb';
import * as commonDefinitions from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as managementDefinitions from '@trezor/protobuf/src/definitions/messages-management_pb';
import * as messageTypeDefinitions from '@trezor/protobuf/src/definitions/messages_pb';
import * as optionDefinitions from '@trezor/protobuf/src/definitions/options_pb';

let isLoaded = false;

/**
 * Registers the protobuf messages the migration exchanges with the device. The shared
 * `protobufManager` starts empty and the bridge transport encodes through it, so this has to
 * run before the first device call. Only the Bitcoin, common and management messages are
 * loaded, together with the message-id enum and the option carrying wire-type overrides.
 */
export const loadProtobufDefinitions = () => {
    if (isLoaded) return;

    protobufManager.load([
        bitcoinDefinitions,
        commonDefinitions,
        managementDefinitions,
        messageTypeDefinitions,
        optionDefinitions,
    ]);
    isLoaded = true;
};
