import { mapEverstakeBatchItem } from './everstakeStats';

describe(mapEverstakeBatchItem.name, () => {
    it('keys the batch item figures under the Everstake provider', () => {
        expect(
            mapEverstakeBatchItem({
                symbol: 'eth',
                stats: { apy: 3.1, nextRewardPayout: 3600 },
                validators: { activationTime: 1 },
            }),
        ).toEqual({
            everstake: {
                stats: { apy: 3.1, nextRewardPayout: 3600 },
                validators: { activationTime: 1 },
            },
        });
    });
});
