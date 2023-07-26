import { CoinjoinPrison } from '../../src/client/CoinjoinPrison';

describe('CoinjoinPrison', () => {
    it('release inmate when Round is no longer present in Status', done => {
        const inmate = {
            accountKey: 'account-A',
            type: 'input',
            sentenceStart: Date.now() - 10000,
        } as const;

        const prison = new CoinjoinPrison([
            { ...inmate, id: '00AA', roundId: '00', sentenceEnd: Date.now() + 10000 }, // will be released - round not present)
            { ...inmate, id: '00AB', roundId: '00', sentenceEnd: Infinity }, // will NOT be released - sentence Infinity
            { ...inmate, id: '01AA', roundId: '01', sentenceEnd: Date.now() + 10000 }, // wil NOT be released - round IS present
            { ...inmate, id: '01AB', roundId: '01', sentenceEnd: Date.now() - 1 }, // will be released - sentence is lower
        ]);

        prison.on('change', () => done()); // end test after change event

        prison.release(['01']); // only one round is present in Status

        expect(prison.inmates.map(({ id }) => id)).toEqual(['00AB', '01AA']);
    });
});
