import { BigNumber } from '@trezor/utils';

import { buildClaim } from '../../../builder/evm/claim';
import { asEvmAddress } from '../../../types/evm';
import { Verifier } from '../../../verifier';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');
const TOKEN = asEvmAddress('0x58D97B57BB95320F9a05dC918Aef65434969c2B2');
const AMOUNT = 848795999565318n;
const PROOF: `0x${string}`[] = [
    '0xd8f0361b28675e4ac82f066f7abdaaffaa6e0fbd418f60dca41ae70656edd18b',
    '0xee9c56aed75a9334b2e01d65a99bc14f2ca6484444de4de98517466ed8d8129a',
    '0x5d584a6df796f8af2df049691775088d4f3150138e46c69d89375411e0a3cbca',
];

const claimHex = buildClaim(
    {
        users: [SENDER],
        tokens: [TOKEN],
        amounts: [new BigNumber(AMOUNT.toString())],
        proofs: [PROOF],
    },
    { sender: SENDER },
).data!;

describe('verifyClaim', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.distributor.claim(claimHex, {
                users: [SENDER],
                tokens: [TOKEN],
                amounts: [AMOUNT],
                proofs: [PROOF],
            }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH when users array differs', () => {
        expect(
            Verifier.evm.distributor.claim(claimHex, {
                users: ['0x1111111111111111111111111111111111111111'],
                tokens: [TOKEN],
                amounts: [AMOUNT],
                proofs: [PROOF],
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'users' }] });
    });

    it('returns VALUE_MISMATCH when amounts array differs', () => {
        expect(
            Verifier.evm.distributor.claim(claimHex, {
                users: [SENDER],
                tokens: [TOKEN],
                amounts: [999n],
                proofs: [PROOF],
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'amounts' }] });
    });

    it('returns VALUE_MISMATCH when proofs array differs', () => {
        expect(
            Verifier.evm.distributor.claim(claimHex, {
                users: [SENDER],
                tokens: [TOKEN],
                amounts: [AMOUNT],
                proofs: [[`0x${'ab'.repeat(32)}` as `0x${string}`]],
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'proofs' }] });
    });

    it('compares addresses case-insensitively', () => {
        expect(
            Verifier.evm.distributor.claim(claimHex, {
                users: [SENDER.toUpperCase() as typeof SENDER],
                tokens: [TOKEN],
                amounts: [AMOUNT],
                proofs: [PROOF],
            }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns isValid true when partial checked fields match', () => {
        expect(
            Verifier.evm.distributor.claim(
                claimHex,
                { users: [SENDER], tokens: [TOKEN], amounts: [999n], proofs: [PROOF] },
                ['users', 'tokens'],
            ),
        ).toEqual({ isValid: true, issues: [] });
    });
});
