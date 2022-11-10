import * as coinjoinUtils from '../coinjoinUtils';
import * as fixtures from '../__fixtures__/coinjoinUtils';

describe('breakdownCoinjoinBalance', () => {
    const commonUtxo = {
        txid: '1',
        vout: 1,
        amount: '100',
        blockHeight: 100,
        path: 'string',
        confirmations: 100,
    };

    const params: Parameters<typeof coinjoinUtils.breakdownCoinjoinBalance>[0] = {
        targetAnonymity: 80,
        anonymitySet: {
            one: 1,
            two: 100,
            three: 30,
        },
        utxos: [
            {
                address: 'one',
                ...commonUtxo,
            },
            {
                address: 'two',
                ...commonUtxo,
            },
            {
                address: 'three',
                ...commonUtxo,
            },
        ],
    };

    it('works without session', () => {
        const breakdown = coinjoinUtils.breakdownCoinjoinBalance(params);

        expect(breakdown).toEqual({
            notAnonymized: '200',
            anonymized: '100',
        });
    });
});

describe('getSessionDeadlineFormat', () => {
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2022-02-22T22:22:22Z').getTime());

    it('works with hours, munites and seconds left', () => {
        const result = coinjoinUtils.getSessionDeadlineFormat(
            new Date('2022-02-22T23:44:44').getTime(),
        );

        expect(result).toEqual(['hours']);
    });

    it('works with minutes and seconds left', () => {
        const result = coinjoinUtils.getSessionDeadlineFormat(
            new Date('2022-02-22T22:24:44Z').getTime(),
        );

        expect(result).toEqual(['minutes']);
    });

    it('works with seconds left', () => {
        const result = coinjoinUtils.getSessionDeadlineFormat(
            new Date('2022-02-22T22:22:44Z').getTime(),
        );

        expect(result).toEqual(['seconds']);
    });
});

describe('getMaxRounds', () => {
    fixtures.getMaxRounds.forEach(f => {
        it(f.description, () => {
            expect(
                coinjoinUtils.getMaxRounds(f.params.targetAnonymity, f.params.anonymitySet),
            ).toEqual(f.result);
        });
    });
});
