import {
    stakingProductDescriptorObjectSchema,
    stakingProductDescriptorSchema,
} from './stakingProductDescriptor';
import { mockStakingProductDescriptor } from '../mocks';

describe('stakingProductDescriptorSchema', () => {
    it('parses a descriptor unchanged', () => {
        const descriptor = mockStakingProductDescriptor();

        expect(stakingProductDescriptorSchema.parse(descriptor)).toEqual(descriptor);
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
