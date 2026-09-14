import * as fixtures from './__fixtures__/largestFirst';
import { largestFirst } from './largestFirst';
import { sanityCheck } from '../__fixtures__/sanityCheck';

describe('coinSelection - largestFirst', () => {
    fixtures.nonFinalCompose.forEach(f => {
        test(f.description, () => {
            const { utxos, outputs, changeAddress, certificates, withdrawals, accountPubKey } = f;
            const res = largestFirst(
                {
                    utxos,
                    outputs,
                    changeAddress,
                    certificates,
                    withdrawals,
                    accountPubKey,
                },
                f.options,
            );

            expect(res).toMatchObject(f.result);
        });
    });

    fixtures.coinSelection.forEach(f => {
        test(f.description, () => {
            const { utxos, outputs, changeAddress, certificates, withdrawals, accountPubKey, ttl } =
                f;
            const res = largestFirst(
                {
                    utxos,
                    outputs,
                    changeAddress,
                    certificates,
                    withdrawals,
                    accountPubKey,
                    ttl,
                },
                f.options,
            );

            expect(res).toMatchObject(f.result);
            sanityCheck(res);
        });
    });

    fixtures.exceptions.forEach(f => {
        test(f.description, () => {
            const { utxos, outputs, changeAddress, certificates, withdrawals, accountPubKey } = f;
            const res = () =>
                largestFirst(
                    {
                        utxos,
                        outputs,
                        changeAddress,
                        certificates,
                        withdrawals,
                        accountPubKey,
                    },
                    f.options,
                );

            expect(res).toThrow(expect.objectContaining({ code: f.result }));
        });
    });
});
