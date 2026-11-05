import { stakingPositionDetailsSchema } from './stakingPositionDetails';

const solanaDetails = {
    kind: 'solana-stake-accounts',
    epoch: 800,
    stakeAccounts: [
        {
            status: 'active',
            stake: '4000000000',
            rentExemptReserve: '2282880',
            activationEpoch: 790,
        },
        {
            status: 'inactive',
            stake: '300000000',
            rentExemptReserve: '2282880',
            activationEpoch: null,
        },
    ],
};

describe('stakingPositionDetailsSchema', () => {
    it('parses the Solana stake accounts unchanged', () => {
        expect(stakingPositionDetailsSchema.parse(solanaDetails)).toEqual(solanaDetails);
    });

    it('parses Solana details without a known epoch', () => {
        const details = { ...solanaDetails, epoch: null, stakeAccounts: [] };

        expect(stakingPositionDetailsSchema.parse(details)).toEqual(details);
    });

    it('rejects an unknown kind', () => {
        const result = stakingPositionDetailsSchema.safeParse({ ...solanaDetails, kind: 'tron' });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['kind']);
    });

    it('rejects an unknown stake account status', () => {
        const result = stakingPositionDetailsSchema.safeParse({
            ...solanaDetails,
            stakeAccounts: [
                {
                    status: 'cooling',
                    stake: '1',
                    rentExemptReserve: '2282880',
                    activationEpoch: 790,
                },
            ],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['stakeAccounts', 0, 'status']);
    });

    it('rejects a stake that is not a base-unit string', () => {
        const result = stakingPositionDetailsSchema.safeParse({
            ...solanaDetails,
            stakeAccounts: [
                {
                    status: 'active',
                    stake: '1.5',
                    rentExemptReserve: '2282880',
                    activationEpoch: 790,
                },
            ],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['stakeAccounts', 0, 'stake']);
    });

    it('rejects a rent reserve that is not a base-unit string', () => {
        const result = stakingPositionDetailsSchema.safeParse({
            ...solanaDetails,
            stakeAccounts: [
                { status: 'active', stake: '1', rentExemptReserve: '-1', activationEpoch: 790 },
            ],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['stakeAccounts', 0, 'rentExemptReserve']);
    });
});
