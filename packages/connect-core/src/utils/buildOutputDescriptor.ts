import { HD_HARDENED_PATH_PART, fromHardenedPathPart } from '@trezor/crypto-utils';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { addDescriptorChecksum } from '@trezor/utxo-lib';

const FORMATS: Partial<Record<PROTO.InputScriptType, string>> = {
    SPENDADDRESS: 'pkh({})',
    SPENDP2SHWITNESS: 'sh(wpkh({}))',
    SPENDWITNESS: 'wpkh({})',
    SPENDTAPROOT: 'tr({})',
};

type BuildOutputDescriptorParams = {
    path: number[];
    scriptType?: PROTO.InputScriptType;
    // without the script-dependent xpub magic
    xpub: string;
    // absent from firmware older than 2.3.5 and 1.9.4, decoded as null
    rootFingerprint?: number | null;
};

// Builds the BIP-380 output descriptor for firmware older than 2.7.0 and 1.14.0, the same way as
// newer firmware does.
export const buildOutputDescriptor = ({
    path,
    scriptType = 'SPENDADDRESS',
    xpub,
    rootFingerprint,
}: BuildOutputDescriptorParams) => {
    const format = FORMATS[scriptType];
    if (!format) return undefined;

    const origin = path
        .map(i => `/${fromHardenedPathPart(i)}${i & HD_HARDENED_PATH_PART ? 'h' : ''}`)
        .join('');
    const fingerprint = (rootFingerprint ?? 0).toString(16).padStart(8, '0');

    return addDescriptorChecksum(format.replace('{}', `[${fingerprint}${origin}]${xpub}/<0;1>/*`));
};
