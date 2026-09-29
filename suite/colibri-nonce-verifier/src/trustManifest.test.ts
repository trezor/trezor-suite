import { validateTrustManifest } from './trustManifest';
import { mockNonceFixture, mockTrustManifest } from '../mocks/mockColibriFixtures';

const NOW_MS = Date.parse('2026-09-25T00:00:00Z');

describe('validateTrustManifest', () => {
    it('accepts a complete manifest and normalizes it', () => {
        const result = validateTrustManifest(mockTrustManifest(), NOW_MS);

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.manifest.policyId).toBe('test-policy');
        expect(result.manifest.checkpoint.root).toBe(mockNonceFixture.checkpoint.root);
        expect(result.manifest.endpoints.prover).toEqual(['https://prover.test']);
    });

    it('rejects an unpopulated checkpoint', () => {
        expect(validateTrustManifest(mockTrustManifest({ checkpoint: null }), NOW_MS)).toEqual({
            success: false,
            error: 'checkpoint missing',
        });
    });

    it('rejects an expired review', () => {
        expect(
            validateTrustManifest(
                mockTrustManifest({ reviewExpiresAt: '2026-09-24T00:00:00Z' }),
                NOW_MS,
            ),
        ).toEqual({ success: false, error: 'trust manifest review expired' });
    });

    it('rejects malformed roots, chains, endpoints and policy ids', () => {
        const checkpoint = { ...mockTrustManifest().checkpoint, root: '0x1234' };
        expect(validateTrustManifest(mockTrustManifest({ checkpoint }), NOW_MS).success).toBe(
            false,
        );
        expect(validateTrustManifest(mockTrustManifest({ chainId: '5' }), NOW_MS)).toEqual({
            success: false,
            error: 'unsupported chainId',
        });
        const endpoints = { ...mockTrustManifest().endpoints, prover: ['http://prover.test'] };
        expect(validateTrustManifest(mockTrustManifest({ endpoints }), NOW_MS).success).toBe(false);
        expect(validateTrustManifest(mockTrustManifest({ policyId: '../x' }), NOW_MS).success).toBe(
            false,
        );
        expect(validateTrustManifest(null, NOW_MS).success).toBe(false);
    });
});
