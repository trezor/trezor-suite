export * from './decode';
export * from './encode';
export * from './messages';
export * from './utils';
export * as constants from './constants';

export {
    getCpaceHostKeys,
    getSharedSecret,
    getHandshakeHash,
    handleHandshakeInit,
    validateCodeEntryTag,
    validateQrCodeTag,
    validateNfcTag,
} from './crypto/pairing';
export { ThpState } from './ThpState';
export { getCurve25519KeyPair } from './crypto/curve25519';
export { getThpPairingMethod } from './utils';

export const name = 'thp';
