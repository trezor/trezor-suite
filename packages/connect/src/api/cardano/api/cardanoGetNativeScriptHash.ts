// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetNativeScriptHash.js

import { PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import {
    CardanoGetNativeScriptHash as CardanoGetNativeScriptHashSchema,
    CardanoNativeScript,
} from '../../../types/api/cardano';
import { Assert } from '@trezor/schema-utils';

export default class CardanoGetNativeScriptHash extends AbstractMethod<
    'cardanoGetNativeScriptHash',
    PROTO.CardanoGetNativeScriptHash
> {
    init() {
        this.requiredPermissions = ['read'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );

        const { payload } = this;

        Assert(CardanoGetNativeScriptHashSchema, payload);

        this.validateScript(payload.script);

        this.params = {
            script: this.scriptToProto(payload.script),
            display_format: payload.displayFormat,
            derivation_type:
                typeof payload.derivationType !== 'undefined'
                    ? payload.derivationType
                    : PROTO.CardanoDerivationType.ICARUS_TREZOR,
        };
    }

    get info() {
        return 'Get Cardano native script hash';
    }

    validateScript(script: CardanoNativeScript) {
        if (script.keyPath) {
            validatePath(script.keyPath, 3);
        }

        if (script.scripts) {
            script.scripts.forEach(nestedScript => {
                this.validateScript(nestedScript);
            });
        }
    }

    scriptToProto(script: CardanoNativeScript): PROTO.CardanoNativeScript {
        let scripts: PROTO.CardanoNativeScript[] = [];
        if (script.scripts) {
            scripts = script.scripts.map(nestedScript => this.scriptToProto(nestedScript));
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
    }

    async run() {
        const { message } = await this.device
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
