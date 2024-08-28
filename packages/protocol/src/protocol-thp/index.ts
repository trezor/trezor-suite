export * from './decode';
export * from './encode';
export * from './messages';
export {
    getCpaceHostKeys,
    getShareSecret,
    handleHandshakeInitResponse,
    handleHandshakeCompletionResponse,
    validateHP5,
    validateHP6,
    validateHP7,
} from './crypto/pairing';
export { ThpProtocolState } from './ThpProtocolState';
export { getCurve25519KeyPair } from './crypto/curve25519';

export const name = 'thp';
