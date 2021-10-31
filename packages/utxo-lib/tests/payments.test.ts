import * as PAYMENTS from '../src/payments';
import type { PaymentCreator } from '../src/payments';
import * as utils from './payments.utils';

(
    [
        'embed',
        'p2ms',
        'p2pk',
        'p2pkh',
        'p2sh',
        'p2tr',
        'p2wpkh',
        'p2wsh',
        'sstxchange',
        'sstxcommitment',
        'sstxpkh',
        'sstxsh',
    ] as const
).forEach(p => {
    describe(p, () => {
        const fn: PaymentCreator = PAYMENTS[p];
        // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
        const { fixtures } = require(`./__fixtures__/payments/${p}`);

        fixtures.valid.forEach((f: any) => {
            it(`${f.description} as expected`, () => {
                const args = utils.preform(f.arguments);
                const actual = fn(args, f.options);

                utils.equate(actual, f.expected, f.arguments);
            });

            it(`${f.description} as expected (no validation)`, () => {
                const args = utils.preform(f.arguments);
                const actual = fn(args, { ...f.options, validate: false });

                utils.equate(actual, f.expected, f.arguments);
            });
        });

        fixtures.invalid.forEach((f: any) => {
            it(`throws ${f.exception} ${f.description ? `for ${f.description}` : ''}`, () => {
                const args = utils.preform(f.arguments);

                expect(() => fn(args, f.options)).toThrow(f.exception);
            });
        });

        if (p === 'p2sh') {
            const { p2wsh, p2pk } = PAYMENTS;
            it('properly assembles nested p2wsh with names', () => {
                const actual = fn({
                    redeem: p2wsh({
                        redeem: p2pk({
                            pubkey: Buffer.from(
                                '03e15819590382a9dd878f01e2f0cbce541564eb415e43b440472d883ecd283058',
                                'hex',
                            ),
                        }),
                    }),
                });
                expect(actual.address).toBe('3MGbrbye4ttNUXM8WAvBFRKry4fkS9fjuw');
                expect(actual.name).toBe('p2sh-p2wsh-p2pk');
                expect(actual.redeem!.name).toBe('p2wsh-p2pk');
                expect(actual.redeem!.redeem!.name).toBe('p2pk');
            });
        }

        // cross-verify dynamically too
        if (!fixtures.dynamic) return;
        const { depends, details } = fixtures.dynamic;

        details.forEach((f: any) => {
            const detail = utils.preform(f);
            const disabled: any = {};
            if (f.disabled)
                f.disabled.forEach((k: string) => {
                    disabled[k] = true;
                });

            // eslint-disable-next-line no-restricted-syntax
            for (const key in depends) {
                // eslint-disable-next-line no-continue
                if (key in disabled) continue;
                const dependencies = depends[key];

                // eslint-disable-next-line no-loop-func
                dependencies.forEach((dependency: any) => {
                    if (!Array.isArray(dependency)) dependency = [dependency];

                    const args: any = {};
                    dependency.forEach((d: any) => {
                        utils.from(d, detail, args);
                    });
                    if (detail.network) {
                        args.network = detail.network;
                    }
                    if (detail.amount) {
                        args.amount = detail.amount;
                    }
                    const expected = utils.from(key, detail);

                    it(`${f.description}, ${key} derives from ${JSON.stringify(
                        dependency,
                    )}`, () => {
                        utils.equate(fn(args), expected);
                    });
                });
            }
        });
    });
});
