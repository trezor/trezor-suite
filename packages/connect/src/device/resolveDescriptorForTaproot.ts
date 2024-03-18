import { HDNodeResponse } from '../types/api/getPublicKey';
import { MessagesSchema as Messages } from '@trezor/protobuf';

interface Params {
    response: HDNodeResponse;
    publicKey: Messages.PublicKey;
}

export const resolveDescriptorForTaproot = ({ response, publicKey }: Params) => {
    if (publicKey.descriptor !== null && publicKey.descriptor !== undefined) {
        const [xpub, checksum] = publicKey.descriptor.split('#');

        // This is here to keep backwards compatibility, suite and blockbooks are still using `'` over `h`
        const openingSquareBracketSplit = xpub.split('[');
        if (openingSquareBracketSplit.length === 2) {
            const [beforeOpeningBracket, afterOpeningBracket] = openingSquareBracketSplit;

            const closingSquareBracketSplit = afterOpeningBracket.split(']');
            if (closingSquareBracketSplit.length === 2) {
                const [path, afterClosingBracket] = closingSquareBracketSplit;

                const correctedPath = path.replace(/h/g, "'"); // .replaceAll()

                return {
                    xpub: `${beforeOpeningBracket}[${correctedPath}]${afterClosingBracket}`,
                    checksum,
                };
            }
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
