import { stakingPositionDetailsSchema } from './stakingPositionDetails';

const solanaDetails = {
    kind: 'solana-stake-accounts',
    epoch: 800,
    stakeAccounts: [
        { status: 'active', stake: '4000000000', activationEpoch: 790 },
        { status: 'inactive', stake: '300000000', activationEpoch: null },
    ],
};

const cardanoDetails = {
    kind: 'cardano-delegation',
    poolId: 'pool1xflehvzad4wr6rrvf6eea65jst5af0r4k0rh4xvmnqgvkzt3xjt',
    drep: { id: 'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3', hasScript: false },
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
            stakeAccounts: [{ status: 'cooling', stake: '1', activationEpoch: 790 }],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['stakeAccounts', 0, 'status']);
    });

    it('rejects a stake that is not a base-unit string', () => {
        const result = stakingPositionDetailsSchema.safeParse({
            ...solanaDetails,
            stakeAccounts: [{ status: 'active', stake: '1.5', activationEpoch: 790 }],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['stakeAccounts', 0, 'stake']);
    });

    it('parses the Cardano delegation unchanged', () => {
        expect(stakingPositionDetailsSchema.parse(cardanoDetails)).toEqual(cardanoDetails);
    });

    it('parses a Cardano stake key without a pool and without a DRep', () => {
        const details = { ...cardanoDetails, poolId: null, drep: null };

        expect(stakingPositionDetailsSchema.parse(details)).toEqual(details);
    });

    it('rejects a Cardano DRep without an id', () => {
        const result = stakingPositionDetailsSchema.safeParse({
            ...cardanoDetails,
            drep: { id: '', hasScript: false },
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['drep', 'id']);
    });

    it('rejects an unknown key on the Cardano delegation', () => {
        const result = stakingPositionDetailsSchema.safeParse({
            ...cardanoDetails,
            stakeAddress: 'stake1u9ylzsgxaa6xctf4juup682ar3juj85n8tx3hthnljg47zctvm3rc',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
    });
});
