import * as utils from '../../src/client/clientUtils';

describe('clientUtils', () => {
    it('getCommitmentData', () => {
        expect(utils.getCommitmentData('CoinJoinCoordinatorIdentifier', '001234')).toEqual(
            '1d436f696e4a6f696e436f6f7264696e61746f724964656e746966696572001234',
        );
    });

    it('sortOutputs', () => {
        // sorting by amount
        expect(
            [
                { scriptPubKey: '0', value: 2 },
                { scriptPubKey: '1', value: 1 },
            ].sort(utils.sortOutputs),
        ).toEqual([
            { scriptPubKey: '0', value: 2 },
            { scriptPubKey: '1', value: 1 },
        ]);
        // sorting by scriptPubKey
        expect(
            [
                { scriptPubKey: '0 10', value: 1 },
                { scriptPubKey: '0 10', value: 1 },
                { scriptPubKey: '0 00', value: 1 },
                { scriptPubKey: '1 12', value: 1 },
                { scriptPubKey: '1 11', value: 1 },
            ].sort(utils.sortOutputs),
        ).toEqual([
            { scriptPubKey: '0 00', value: 1 },
            { scriptPubKey: '0 10', value: 1 },
            { scriptPubKey: '0 10', value: 1 },
            { scriptPubKey: '1 11', value: 1 },
            { scriptPubKey: '1 12', value: 1 },
        ]);
    });

    it('mergePubkeys', () => {
        expect(
            utils.mergePubkeys([
                { Type: 'OutputAdded', output: { scriptPubKey: '01', value: 1 } },
                { Type: 'OutputAdded', output: { scriptPubKey: '02', value: 1 } },
                { Type: 'OutputAdded', output: { scriptPubKey: '03', value: 1 } },
            ]),
        ).toEqual([
            { Type: 'OutputAdded', output: { scriptPubKey: '01', value: 1 } },
            { Type: 'OutputAdded', output: { scriptPubKey: '02', value: 1 } },
            { Type: 'OutputAdded', output: { scriptPubKey: '03', value: 1 } },
        ]);

        expect(
            utils.mergePubkeys([
                { Type: 'OutputAdded', output: { scriptPubKey: '01', value: 1 } },
                { Type: 'OutputAdded', output: { scriptPubKey: '01', value: 1 } },
                { Type: 'OutputAdded', output: { scriptPubKey: '02', value: 1 } },
                { Type: 'OutputAdded', output: { scriptPubKey: '01', value: 1 } },
            ]),
        ).toEqual([
            { Type: 'OutputAdded', output: { scriptPubKey: '01', value: 3 } },
            { Type: 'OutputAdded', output: { scriptPubKey: '02', value: 1 } },
        ]);
    });
});
