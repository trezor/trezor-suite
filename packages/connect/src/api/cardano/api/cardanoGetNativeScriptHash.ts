// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetNativeScriptHash.js

import type { CardanoNativeScript } from '@trezor/connect-common/src/types/api/cardano';
import { CardanoGetNativeScriptHash as CardanoGetNativeScriptHashSchema } from '@trezor/connect-common/src/types/api/cardano';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

const validateScript = (script: CardanoNativeScript) => {
    if (script.keyPath) {
        validatePath(script.keyPath, 3);
    }

    script.scripts?.forEach(validateScript);
};

const scriptToProto = (script: CardanoNativeScript): PROTO.CardanoNativeScript => {
    let scripts: PROTO.CardanoNativeScript[] = [];
    if (script.scripts) {
        scripts = script.scripts.map(scriptToProto);
    }
    let keyPath: number[] = [];
    if (script.keyPath) {
        keyPath = validatePath(script.keyPath, 3);
    }

    return {
        type: script.type,
        scripts,
        key_hash: script.keyHash,
        key_path: keyPath,
        required_signatures_count: script.requiredSignaturesCount,
        invalid_before: script.invalidBefore,
        invalid_hereafter: script.invalidHereafter,
    };
};

export default class CardanoGetNativeScriptHash extends AbstractMethod<
    'cardanoGetNativeScriptHash',
    PROTO.CardanoGetNativeScriptHash
> {
    constructor(message: MethodMessage<'cardanoGetNativeScriptHash'>) {
        const { payload } = message;

        Assert(CardanoGetNativeScriptHashSchema, payload);

        validateScript(payload.script);

        const params = {
            script: scriptToProto(payload.script),
            display_format: payload.displayFormat,
            derivation_type:
                typeof payload.derivationType !== 'undefined'
                    ? payload.derivationType
                    : PROTO.CardanoDerivationType.ICARUS_TREZOR,
        };

        super(message, params);
        this.requiredDeviceCapabilities = ['Capability_Cardano'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Get Cardano native script hash';
    }

    async run() {
        const { message } = await this.getDevice()
            .getCommands()
            .typedCall('CardanoGetNativeScriptHash', 'CardanoNativeScriptHash', {
                script: this.params.script,
                display_format: this.params.display_format,
                derivation_type: this.params.derivation_type,
            });

        return {
            scriptHash: message.script_hash,
        };
    }
}
