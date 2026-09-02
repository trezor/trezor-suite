import { base58 } from '@scure/base';

import { SolanaSignMessage as SolanaSignMessageSchema } from '@trezor/connect-common';
import type { PermissionRequest } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';

type Params = {
    address_n: number[];
    message: string;
    signers: string[];
    chunkify?: boolean;
};

export default class SolanaSignMessage extends AbstractMethod<'solanaSignMessage', Params> {
    constructor(message: MethodMessage<'solanaSignMessage'>) {
        const { payload } = message;

        Assert(SolanaSignMessageSchema, payload);

        const path = validatePath(payload.path, 2);

        const params: Params = {
            address_n: path,
            message: payload.message,
            signers: payload.signers ?? [],
            chunkify: payload.chunkify,
        };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('sol')];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign_message', this.requiredFirmwareCoins);
    }

    get info() {
        return 'Sign Solana message';
    }

    async run() {
        const cmd = this.getDevice().getCommands();

        // OCMS v1 requires a non-empty signer set that includes the signing key. For the common
        // single-signer case the caller may omit `signers`, so derive it from the signing path.
        let signerHexBytes: string[];
        if (this.params.signers.length > 0) {
            signerHexBytes = this.params.signers.map(s =>
                Buffer.from(base58.decode(s)).toString('hex'),
            );
        } else {
            const { message: publicKey } = await cmd.typedCall(
                'SolanaGetPublicKey',
                'SolanaPublicKey',
                { address_n: this.params.address_n, show_display: false },
            );
            signerHexBytes = [publicKey.public_key];
        }

        const { message } = await cmd.typedCall('SolanaSignMessage', 'SolanaMessageSignature', {
            address_n: this.params.address_n,
            message: {
                message: this.params.message,
                signers: signerHexBytes,
            },
            chunkify: this.params.chunkify,
        });

        return {
            signature: message.signature,
            ...(message.signed_data !== undefined && { signedData: message.signed_data }),
        };
    }
}
