import { MessagesSchema as Messages } from '@trezor/protobuf';
import { convertTaprootXpub } from '@trezor/utils';

import { HDNodeResponse } from '../types/api/getPublicKey';

interface ResolveDescriptorForTaprootParams {
    response: HDNodeResponse;
    publicKey: Messages.PublicKey;
}

export const resolveDescriptorForTaproot = ({
    response,
    publicKey,
}: ResolveDescriptorForTaprootParams) => {
    if (publicKey.descriptor !== null && publicKey.descriptor !== undefined) {
        const [xpub, checksum] = publicKey.descriptor.split('#');

        // This is here to keep backwards compatibility, suite and block-books
        // are still using `'` over `h`.
        const correctedXpub = convertTaprootXpub({ xpub, direction: 'h-to-apostrophe' });

        if (correctedXpub !== null) {
            return { xpub: correctedXpub, checksum };
        }
    }

    // wrap regular xpub into bitcoind native descriptor
    const fingerprint = Number(publicKey.root_fingerprint || 0)
        .toString(16)
        .padStart(8, '0');
    const descriptorPath = `${fingerprint}${response.serializedPath.substring(1)}`;

    return {
        xpub: `tr([${descriptorPath}]${response.xpub}/<0;1>/*)`,
        checksum: undefined,
    };
};
