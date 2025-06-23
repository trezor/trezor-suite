import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { createHash } from 'crypto';

export const deriveMnemonic = (secret: string) => {
    const keyBuffer = Buffer.from(secret, 'hex');
    const hash = createHash('sha256').update(keyBuffer).digest('hex').slice(0, 32);

    return bip39.entropyToMnemonic(new Uint8Array(Buffer.from(hash, 'hex')), wordlist);
};
