import { stakingPlatformSupportSchema, stakingProductPlatformsSchema } from './stakingPlatform';

describe('stakingPlatformSupportSchema', () => {
    it('accepts manage access with an operation subset', () => {
        const support = { access: 'manage', operations: ['stake', 'unstake'] };

        expect(stakingPlatformSupportSchema.parse(support)).toEqual(support);
    });

    it.each(['read-only', 'listed', 'hidden'])('accepts %s access without operations', access => {
        expect(stakingPlatformSupportSchema.parse({ access })).toEqual({ access });
    });

    it('rejects an unknown operation in the subset', () => {
        const result = stakingPlatformSupportSchema.safeParse({
            access: 'manage',
            operations: ['fly'],
        });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown access level', () => {
        expect(stakingPlatformSupportSchema.safeParse({ access: 'view' }).success).toBe(false);
    });
});

describe('stakingProductPlatformsSchema', () => {
    it('requires an entry for every platform', () => {
        const result = stakingProductPlatformsSchema.safeParse({ desktop: { access: 'manage' } });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown platform', () => {
        const result = stakingProductPlatformsSchema.safeParse({
            desktop: { access: 'manage' },
            mobile: { access: 'read-only' },
            web: { access: 'manage' },
        });

        expect(result.success).toBe(false);
    });
});
