import { HDNodeResponse } from '../types/api/getPublicKey';
import { MessagesSchema as Messages } from '@trezor/protobuf';

interface Params {
    response: HDNodeResponse;
    publicKey: Messages.PublicKey;
}

// This is here to keep backwards compatibility, suite and blockbooks are still using `'` over `h`
export const replaceHardened = (descriptor: string) => {
    const [match] = descriptor.match(/\[[a-fh0-9/]+\]/) ?? [];

    return match ? descriptor.replace(match, match.replaceAll('h', "'")) : descriptor;
};

export const resolveDescriptorForTaproot = ({ response, publicKey }: Params) => {
    if (publicKey.descriptor !== null && publicKey.descriptor !== undefined) {
        const [xpub, checksum] = publicKey.descriptor.split('#');

        return {
            xpub: replaceHardened(xpub),
            checksum,
        };
    } else {
        // wrap regular xpub into bitcoind native descriptor
        const fingerprint = Number(publicKey.root_fingerprint || 0)
            .toString(16)
            .padStart(8, '0');
        const descriptorPath = `${fingerprint}${response.serializedPath.substring(1)}`;

        return {
            xpub: `tr([${descriptorPath}]${response.xpub}/<0;1>/*)`,
            checksum: undefined,
        };
    }
};
