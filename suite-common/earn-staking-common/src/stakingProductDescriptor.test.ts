import { mockStakingProductDescriptor } from '../mocks';
import { stakingAssetSymbolSchema } from './stakingProductAsset';
import {
    stakingProductDescriptorObjectSchema,
    stakingProductDescriptorSchema,
} from './stakingProductDescriptor';
import { stakingProviderIdSchema } from './stakingProvider';

const polygonToken = {
    kind: 'token',
    symbol: stakingAssetSymbolSchema.parse('pol'),
    contract: '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6',
} as const;

describe('stakingProductDescriptorSchema', () => {
    it('parses a descriptor unchanged', () => {
        const descriptor = mockStakingProductDescriptor();

        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    });

    it('parses a token product whose id carries the token symbol', () => {
        const descriptor = mockStakingProductDescriptor({ asset: polygonToken, type: 'native' });

        expect(descriptor.id).toBe('eth:pol:everstake:native');
        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    });

    it('rejects an id that does not match the asset', () => {
        const result = stakingProductDescriptorSchema.safeParse({
            ...mockStakingProductDescriptor(),
            asset: polygonToken,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['id']);
    });

    it('rejects an id that does not match symbol, provider and type', () => {
        const descriptor = mockStakingProductDescriptor();
        const result = stakingProductDescriptorSchema.safeParse({
            ...descriptor,
            type: 'liquid',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['id']);
    });

    it('rejects a limit that is not a base-unit string', () => {
        const descriptor = mockStakingProductDescriptor();
        const result = stakingProductDescriptorSchema.safeParse({
            ...descriptor,
            limits: { ...descriptor.limits, minStakeAmount: 1 },
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['limits', 'minStakeAmount']);
    });

    it('rejects a consent key outside the staking namespace', () => {
        const result = stakingProductDescriptorSchema.safeParse({
            ...mockStakingProductDescriptor(),
            consentKey: 'yield:everstake',
        });

        expect(result.success).toBe(false);
    });

    it('parses a product without operations and without a consent key', () => {
        const descriptor = mockStakingProductDescriptor({
            providerId: stakingProviderIdSchema.parse('external'),
            type: 'native',
            operations: [],
            consentKey: null,
        });

        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    });

    it('parses a product with operations but without staking and without a consent key', () => {
        const descriptor = mockStakingProductDescriptor({
            providerId: stakingProviderIdSchema.parse('external'),
            type: 'native',
            operations: ['unstake', 'claim', 'vote'],
            consentKey: null,
        });

        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    });

    it.each(['stake', 'redelegate'] as const)(
        'rejects a product that offers %s without a consent key',
        operation => {
            const result = stakingProductDescriptorSchema.safeParse(
                mockStakingProductDescriptor({ operations: [operation], consentKey: null }),
            );

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.path).toEqual(['consentKey']);
        },
    );

    it('parses a platform that manages a subset of the product operations', () => {
        const descriptor = mockStakingProductDescriptor({
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'manage', operations: ['stake', 'unstake'] },
            },
        });

        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    });

    it.each([
        {
            name: 'an operation the product does not offer',
            descriptor: mockStakingProductDescriptor({
                platforms: {
                    desktop: { access: 'manage', operations: ['stake', 'claim'] },
                    mobile: { access: 'read-only' },
                },
            }),
        },
        {
            name: 'stake on a product without operations or a consent key',
            descriptor: mockStakingProductDescriptor({
                providerId: stakingProviderIdSchema.parse('external'),
                type: 'native',
                operations: [],
                consentKey: null,
                platforms: {
                    desktop: { access: 'manage', operations: ['stake'] },
                    mobile: { access: 'read-only' },
                },
            }),
        },
    ])('rejects a platform that manages $name', ({ descriptor }) => {
        const result = stakingProductDescriptorSchema.safeParse(descriptor);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['platforms']);
    });

    it('requires every product to say whether it counts in account totals', () => {
        const { isCountedInAccountTotals: _isCounted, ...descriptor } =
            mockStakingProductDescriptor();
        const result = stakingProductDescriptorSchema.safeParse(descriptor);

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['isCountedInAccountTotals']);
    });

    it('parses a product left out of account totals', () => {
        const descriptor = mockStakingProductDescriptor({ isCountedInAccountTotals: false });

        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    });

    it('rejects an unknown operation', () => {
        const result = stakingProductDescriptorSchema.safeParse({
            ...mockStakingProductDescriptor(),
            operations: ['stake', 'borrow'],
        });

        expect(result.success).toBe(false);
    });

    it('rejects a descriptor with an unknown key', () => {
        const result = stakingProductDescriptorSchema.safeParse({
            ...mockStakingProductDescriptor(),
            minimumStake: '1',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
    });

    it('derives schemas from the object schema', () => {
        const { id: _id, ...input } = mockStakingProductDescriptor();

        expect(stakingProductDescriptorObjectSchema.omit({ id: true }).parse(input)).toEqual(input);
        expect(() => stakingProductDescriptorSchema.omit({ id: true })).toThrow();
    });

    it('rejects a message system feature for an unknown operation', () => {
        const result = stakingProductDescriptorSchema.safeParse({
            ...mockStakingProductDescriptor(),
            messageSystemFeatures: { borrow: 'eth.staking.borrow' },
        });

        expect(result.success).toBe(false);
    });
});
