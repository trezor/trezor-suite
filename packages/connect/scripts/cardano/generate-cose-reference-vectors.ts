/* eslint-disable no-console */

// REFERENCE-ONLY TOOL — NOT PART OF THE BUILD.
//
// Proves the provenance of the COSE golden vectors used by the cardanoSignMessage
// unit tests (see sibling PR). For each cardanoSignMessage e2e fixture it builds the
// COSE_Sign1 / COSE_Key structures two independent ways and asserts they are byte-identical:
//
//   1. The exact logic currently shipped in cardanoSignMessage._createCose (via `cbor`).
//   2. EMURGO's @emurgo/cardano-message-signing-nodejs — the official CIP-0008
//      reference implementation (https://cips.cardano.org/cips/cip8).
//
// It then round-trips each vector through @cardano-foundation/cardano-verify-datasignature,
// an independent CIP-30 verifier, confirming the signature is cryptographically valid.
//
// A match + a successful round-trip means the shipped encoding conforms to CIP-0008 and the
// emitted hex can be trusted as a golden fixture. The heavy verification dependencies live
// here, in this throwaway branch, so the sibling test PR stays dependency-free. Run with:
// yarn workspace @trezor/connect tsx scripts/cardano/generate-cose-reference-vectors.ts

/* eslint-disable import/no-extraneous-dependencies -- reference-only dev tool, not shipped */
import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature';
import * as MS from '@emurgo/cardano-message-signing-nodejs';
/* eslint-enable import/no-extraneous-dependencies */
import cbor from 'cbor';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import fixture from '../../e2e/__fixtures__/cardanoSignMessage';

const h = (hex: string) => Buffer.from(hex, 'hex');

// Byte-for-byte replica of cardanoSignMessage._createCose (the implementation under test).
const buildWithCbor = (payload: string, signature: string, address: string, pubKey: string) => {
    const coseSignature = cbor.encode([
        Buffer.from(cbor.encode(new Map().set(1, -8).set('address', h(address)))),
        new Map().set('hashed', false),
        h(payload),
        h(signature),
    ]);
    const coseKey = cbor.encode(new Map().set(1, 1).set(3, -8).set(-1, 6).set(-2, h(pubKey)));

    return {
        coseSignature: Buffer.from(coseSignature).toString('hex'),
        coseKey: Buffer.from(coseKey).toString('hex'),
    };
};

// Independent build via the official CIP-0008 reference implementation.
const buildWithEmurgo = (payload: string, signature: string, address: string, pubKey: string) => {
    const protectedHeaders = MS.HeaderMap.new();
    protectedHeaders.set_algorithm_id(MS.Label.from_algorithm_id(MS.AlgorithmId.EdDSA));
    protectedHeaders.set_header(MS.Label.new_text('address'), MS.CBORValue.new_bytes(h(address)));

    const unprotectedHeaders = MS.HeaderMap.new();
    unprotectedHeaders.set_header(
        MS.Label.new_text('hashed'),
        MS.CBORValue.new_special(MS.CBORSpecial.new_bool(false)),
    );

    const headers = MS.Headers.new(MS.ProtectedHeaderMap.new(protectedHeaders), unprotectedHeaders);
    const coseSign1 = MS.COSESign1.new(headers, h(payload), h(signature));
    const coseKey = MS.EdDSA25519Key.new(h(pubKey)).build();

    return {
        coseSignature: Buffer.from(coseSign1.to_bytes()).toString('hex'),
        coseKey: Buffer.from(coseKey.to_bytes()).toString('hex'),
    };
};

const vectors = fixture.tests.map(test => {
    const { payload } = test.result;
    const { signature, pubKey } = test.result;
    const { address } = test.result.headers.protected;

    const fromCbor = buildWithCbor(payload, signature, address, pubKey);
    const fromEmurgo = buildWithEmurgo(payload, signature, address, pubKey);

    const matches =
        fromCbor.coseSignature === fromEmurgo.coseSignature &&
        fromCbor.coseKey === fromEmurgo.coseKey;

    if (!matches) {
        console.error(`MISMATCH for "${test.description}"`);
        console.error('  cbor  coseSignature:', fromCbor.coseSignature);
        console.error('  emurgo coseSignature:', fromEmurgo.coseSignature);
        console.error('  cbor  coseKey:', fromCbor.coseKey);
        console.error('  emurgo coseKey:', fromEmurgo.coseKey);
        throw new Error(`COSE encoding diverges from CIP-0008 reference for "${test.description}"`);
    }

    // Independent CIP-30 verification: the signature must validate, and a tampered message
    // must not.
    const verified = verifyDataSignature(fromCbor.coseSignature, fromCbor.coseKey);
    const rejectsTampered = !verifyDataSignature(
        fromCbor.coseSignature,
        fromCbor.coseKey,
        'tampered-message',
    );
    if (!verified || !rejectsTampered) {
        throw new Error(`CIP-30 round-trip verification failed for "${test.description}"`);
    }

    console.log(`OK  (emurgo match + round-trip verified)  ${test.description}`);

    return {
        description: test.description,
        payload,
        signature,
        address,
        pubKey,
        coseSignature: fromCbor.coseSignature,
        coseKey: fromCbor.coseKey,
    };
});

const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'cose-reference-vectors.json',
);
writeFileSync(outPath, `${JSON.stringify(vectors, null, 2)}\n`);

console.log(
    `\nAll ${vectors.length} vectors match the CIP-0008 reference and pass CIP-30 round-trip verification. Wrote ${path.basename(
        outPath,
    )}.`,
);
