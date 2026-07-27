import { CoinSelectionError } from '@fivebinaries/coin-selection';
import * as cbor from 'cbor';

export { trezorUtils, coinSelection } from '@fivebinaries/coin-selection';

export const asCoinSelectionError = (error: unknown) => {
    if (error instanceof CoinSelectionError) {
        return error;
    }
};

// Builds the CIP-0008 COSE_Sign1 / COSE_Key structures for a signed Cardano message.
// See https://cips.cardano.org/cips/cip8. The byte layout is consumed by CIP-30 verifiers,
// so the encoding must stay deterministic.
export const createCose = (payload: string, signature: string, address: string, pubKey: string) => {
    const coseSignature = cbor.encode([
        Buffer.from(
            cbor.encode(
                new Map()
                    .set(1, -8) // alg: EdDSA
                    .set('address', Buffer.from(address, 'hex')),
            ),
        ),
        new Map().set('hashed', false),
        Buffer.from(payload, 'hex'),
        Buffer.from(signature, 'hex'),
    ]);
    const coseKey = cbor.encode(
        new Map()
            .set(1, 1) // kty: OKP
            .set(3, -8) // alg: EdDSA
            .set(-1, 6) // crv: Ed25519
            .set(-2, Buffer.from(pubKey, 'hex')),
    );

    return {
        coseSignature: Buffer.from(coseSignature).toString('hex'),
        coseKey: Buffer.from(coseKey).toString('hex'),
    };
};
