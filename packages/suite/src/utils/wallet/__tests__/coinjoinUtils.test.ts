import * as coinjoinUtils from '../coinjoinUtils';

describe('breakdownCoinjoinBalance', () => {
    const commonUtxo = {
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
                txid: '1',
                address: 'one',
                ...commonUtxo,
            },
            {
                txid: '2',
                address: 'two',
                ...commonUtxo,
            },
            {
                txid: '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
                address: 'three',
                ...commonUtxo,
            },
        ],
    };

    it('works without session', () => {
        const breakdown = coinjoinUtils.breakdownCoinjoinBalance(params);

        expect(breakdown).toEqual({
            notAnonymized: '200',
            anonymizing: '0',
            anonymized: '100',
        });
    });

    it('works with session', () => {
        const breakdown = coinjoinUtils.breakdownCoinjoinBalance({
            ...params,
            registeredUtxos: [
                'b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d01000000',
            ],
        });

        expect(breakdown).toEqual({
            notAnonymized: '100',
            anonymizing: '100',
            anonymized: '100',
        });
    });
});
