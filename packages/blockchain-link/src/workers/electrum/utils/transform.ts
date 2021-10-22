import { address as a, crypto as c } from '@trezor/utxo-lib';

export const btcToSat = (btc: number) => Math.round(100000000 * btc).toString();

export const addressToScripthash = (address: string) => {
    const script = a.toOutputScript(address);
    const scripthash = c.sha256(script).reverse().toString('hex');
    return scripthash;
};

export const scriptToScripthash = (hex: string) => {
    const buffer = Buffer.from(hex, 'hex');
    return c.sha256(buffer).reverse().toString('hex');
};

export const blockheaderToBlockhash = (header: string) => {
    const buffer = Buffer.from(header, 'hex');
    const hash = c.hash256(buffer).reverse().toString('hex');
    return hash;
};

export const tryGetScripthash = (
    address: string
): { valid: true; scripthash: string } | { valid: false } => {
    try {
        return {
            valid: true,
            scripthash: addressToScripthash(address),
        };
    } catch {
        return {
            valid: false,
        };
    }
};
