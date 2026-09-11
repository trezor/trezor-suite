import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { addDescriptorChecksum } from '@trezor/utxo-lib';

const PURPOSE_BIP44 = 44;
const PURPOSE_BIP49 = 49;
const PURPOSE_BIP84 = 84;
const PURPOSE_BIP86 = 86;
const PURPOSE_SLIP25 = 10025;

const SCRIPT_TYPE_TO_PURPOSES: Partial<Record<PROTO.InternalInputScriptType, number[]>> = {
    SPENDADDRESS: [PURPOSE_BIP44],
    SPENDP2SHWITNESS: [PURPOSE_BIP49],
    SPENDWITNESS: [PURPOSE_BIP84],
    SPENDTAPROOT: [PURPOSE_BIP86, PURPOSE_SLIP25],
};

const PURPOSE_TO_SCRIPT_TYPE: Record<number, PROTO.InternalInputScriptType> = {
    [PURPOSE_BIP44]: 'SPENDADDRESS',
    [PURPOSE_BIP49]: 'SPENDP2SHWITNESS',
    [PURPOSE_BIP84]: 'SPENDWITNESS',
    [PURPOSE_BIP86]: 'SPENDTAPROOT',
    [PURPOSE_SLIP25]: 'SPENDTAPROOT',
};

type BuildOutputDescriptorBip380Params = {
    coin?: string;
    account: number;
    purpose?: number;
    scriptType?: PROTO.InternalInputScriptType;
    xpub: string;
    rootFingerprint?: number;
    descriptor?: string;
};

export const buildOutputDescriptor = ({
    coin,
    account,
    purpose,
    scriptType,
    xpub,
    rootFingerprint,
    descriptor,
}: BuildOutputDescriptorBip380Params): string | undefined => {
    if (descriptor !== undefined) return descriptor;

    if (purpose === undefined) {
        scriptType ??= 'SPENDADDRESS';
        purpose = SCRIPT_TYPE_TO_PURPOSES[scriptType]?.[0];
        if (purpose === undefined) return undefined;
    } else if (scriptType === undefined) {
        scriptType = PURPOSE_TO_SCRIPT_TYPE[purpose];
        // If we cannot build properly the output descriptor we return undefined.
        if (!scriptType) return undefined;
    } else if (!SCRIPT_TYPE_TO_PURPOSES[scriptType]?.includes(purpose)) {
        return undefined;
    }

    const COIN_TYPE: Record<string, number> = { Bitcoin: 0, Testnet: 1, Regtest: 1 };
    const coinType = COIN_TYPE[coin ?? 'Bitcoin'];
    if (coinType === undefined) {
        return undefined;
    }

    let path = `m/${purpose}h/${coinType}h/${account}h`;
    if (purpose === PURPOSE_SLIP25) {
        if (scriptType === 'SPENDTAPROOT') {
            path += '/1h';
        } else {
            return undefined;
        }
    }

    const fmtMap: Record<Exclude<PROTO.InternalInputScriptType, 'SPENDMULTISIG'>, string> = {
        SPENDADDRESS: 'pkh({})',
        SPENDP2SHWITNESS: 'sh(wpkh({}))',
        SPENDWITNESS: 'wpkh({})',
        SPENDTAPROOT: 'tr({})',
    };

    const fmt = fmtMap[scriptType as Exclude<PROTO.InternalInputScriptType, 'SPENDMULTISIG'>];
    const fingerprint = rootFingerprint ?? 0;
    const inner = `[${fingerprint.toString(16).padStart(8, '0')}${path.slice(1)}]${xpub}/<0;1>/*`;

    return addDescriptorChecksum(fmt.replace('{}', inner));
};
