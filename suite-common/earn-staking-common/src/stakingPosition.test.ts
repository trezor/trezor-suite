import { stakingPositionSchema } from './stakingPosition';
import { stakingProviderIdSchema } from './stakingProvider';
import { mockStakingPosition } from '../mocks';

describe('stakingPositionSchema', () => {
    it('parses a position unchanged', () => {
        const position = mockStakingPosition();

        expect(stakingPositionSchema.parse(position)).toEqual(position);
    });

    it('rejects a balance that is not a base-unit string', () => {
        const position = mockStakingPosition();
        const result = stakingPositionSchema.safeParse({
            ...position,
            balances: { ...position.balances, staked: '1.5' },
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['balances', 'staked']);
    });

    it('accepts a warning with its data', () => {
        const position = mockStakingPosition({
            warnings: [
                {
                    code: 'outdated-provider',
                    providerId: stakingProviderIdSchema.parse('everstake'),
                },
            ],
        });

        expect(stakingPositionSchema.parse(position)).toEqual(position);
    });

    it('rejects a warning without its data', () => {
        const result = stakingPositionSchema.safeParse({
            ...mockStakingPosition(),
            warnings: [{ code: 'outdated-provider' }],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['warnings', 0, 'providerId']);
    });

    it('rejects an unknown warning', () => {
        const result = stakingPositionSchema.safeParse({
            ...mockStakingPosition(),
            warnings: [{ code: 'low-balance' }],
        });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown key on the position or its balances', () => {
        const position = mockStakingPosition();

        expect(stakingPositionSchema.safeParse({ ...position, apy: 3 }).success).toBe(false);
        expect(
            stakingPositionSchema.safeParse({
                ...position,
                balances: { ...position.balances, total: '0' },
            }).success,
        ).toBe(false);
    });

    it('rejects a negative unlock time', () => {
        const position = mockStakingPosition();
        const result = stakingPositionSchema.safeParse({
            ...position,
            unlocks: [{ ...position.unlocks[0], availableAt: -1 }],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['unlocks', 0, 'availableAt']);
    });
});
