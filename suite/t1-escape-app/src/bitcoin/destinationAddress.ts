import { type Result, err, ok } from '@trezor/type-utils';
import { address as addressUtils, payments } from '@trezor/utxo-lib';

import { BITCOIN_NETWORK } from './bitcoinNetwork';
import {
    type DestinationFormat,
    type FirmwareVersion,
    isDestinationFormatSupported,
} from '../firmware/firmwareSupport';

export type Destination = {
    /** Canonical form of the address. This exact string is sent to and shown by the device. */
    address: string;
    format: Exclude<DestinationFormat, 'bech32m'>;
    /** Output script the address encodes. The signed transaction must pay exactly this script. */
    script: Buffer;
};

export type DestinationError =
    | { type: 'empty' }
    | { type: 'invalid' }
    | { type: 'unsupported-format'; format: DestinationFormat }
    | { type: 'own-address' };

type ParsedAddress = { format: DestinationFormat; script: Buffer; address: string };

const WITNESS_V0_KEY_HASH_LENGTH = 20;
const WITNESS_V0_SCRIPT_HASH_LENGTH = 32;

const parseBase58Address = (input: string): ParsedAddress | undefined => {
    try {
        const { version, hash } = addressUtils.fromBase58Check(input, BITCOIN_NETWORK);

        if (version === BITCOIN_NETWORK.pubKeyHash) {
            const script = payments.p2pkh({ hash, network: BITCOIN_NETWORK }).output;

            return script ? { format: 'p2pkh', script, address: input } : undefined;
        }

        if (version === BITCOIN_NETWORK.scriptHash) {
            const script = payments.p2sh({ hash, network: BITCOIN_NETWORK }).output;

            return script ? { format: 'p2sh', script, address: input } : undefined;
        }

        return undefined;
    } catch {
        return undefined;
    }
};

const parseBech32Address = (input: string): ParsedAddress | undefined => {
    try {
        const { version, prefix, data } = addressUtils.fromBech32(input);
        if (prefix !== BITCOIN_NETWORK.bech32) return undefined;

        // Uppercase bech32 is valid, but the device should show the form the user reads on
        // the receiving wallet, which is lowercase.
        const address = addressUtils.toBech32(data, version, prefix);

        if (version !== 0) {
            const script = addressUtils.toOutputScript(address, BITCOIN_NETWORK);

            return { format: 'bech32m', script, address };
        }

        if (data.length === WITNESS_V0_KEY_HASH_LENGTH) {
            const script = payments.p2wpkh({ hash: data, network: BITCOIN_NETWORK }).output;

            return script ? { format: 'bech32', script, address } : undefined;
        }

        if (data.length === WITNESS_V0_SCRIPT_HASH_LENGTH) {
            const script = payments.p2wsh({ hash: data, network: BITCOIN_NETWORK }).output;

            return script ? { format: 'bech32', script, address } : undefined;
        }

        return undefined;
    } catch {
        return undefined;
    }
};

const parseAddress = (input: string): ParsedAddress | undefined => {
    const parsed = parseBase58Address(input) ?? parseBech32Address(input);
    if (!parsed) return undefined;

    // The script must encode back to the very same address. This rejects strings that the
    // lenient decoders accept but that are not canonical Bitcoin mainnet addresses.
    try {
        const canonical = addressUtils.fromOutputScript(parsed.script, BITCOIN_NETWORK);

        return canonical === parsed.address ? parsed : undefined;
    } catch {
        return undefined;
    }
};

export type ValidateDestinationParams = {
    input: string;
    firmwareVersion: FirmwareVersion;
    /** Hex output scripts of every address known to belong to the scanned accounts. */
    ownScripts: ReadonlySet<string>;
};

/**
 * Validates the address the funds are swept to. It has to be a Bitcoin mainnet address in a
 * format the connected firmware can pay to, and it must not belong to the wallet being emptied.
 */
export const validateDestination = ({
    input,
    firmwareVersion,
    ownScripts,
}: ValidateDestinationParams): Result<Destination, DestinationError> => {
    const trimmed = input.trim();
    if (trimmed === '') return err({ type: 'empty' });

    const parsed = parseAddress(trimmed);
    if (!parsed) return err({ type: 'invalid' });

    const { format, script, address } = parsed;

    if (format === 'bech32m' || !isDestinationFormatSupported(firmwareVersion, format)) {
        return err({ type: 'unsupported-format', format });
    }

    if (ownScripts.has(script.toString('hex'))) return err({ type: 'own-address' });

    return ok({ address, format, script });
};

/** Output scripts of the given addresses, as hex. Addresses that cannot be decoded are skipped. */
export const getOutputScripts = (addresses: readonly string[]): Set<string> => {
    const scripts = new Set<string>();

    addresses.forEach(address => {
        try {
            scripts.add(addressUtils.toOutputScript(address, BITCOIN_NETWORK).toString('hex'));
        } catch {
            // An address that cannot be decoded cannot collide with a validated destination.
        }
    });

    return scripts;
};
