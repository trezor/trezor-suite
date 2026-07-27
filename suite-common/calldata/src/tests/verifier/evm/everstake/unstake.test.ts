import { BigNumber } from '@trezor/utils';

import { buildUnstake } from '../../../../builder/evm/everstake/unstake';
import { Verifier } from '../../../../verifier';

const VALUE = 100000000000000000n;
const ALLOWED_INTERCHANGE_NUM = 5;
const SOURCE = 1n;

const unstakeHex = buildUnstake({
    value: new BigNumber(VALUE.toString()),
    allowedInterchangeNum: new BigNumber(ALLOWED_INTERCHANGE_NUM),
    source: new BigNumber(SOURCE.toString()),
}).data!;

describe('verifyUnstake', () => {
    it('returns isValid true on full match', () => {
        expect(
            Verifier.evm.everstake.unstake(unstakeHex, {
                value: VALUE,
                allowedInterchangeNum: ALLOWED_INTERCHANGE_NUM,
                source: SOURCE,
            }),
        ).toEqual({ isValid: true, issues: [] });
    });

    it('returns VALUE_MISMATCH when value differs', () => {
        expect(
            Verifier.evm.everstake.unstake(unstakeHex, {
                value: 999n,
                allowedInterchangeNum: ALLOWED_INTERCHANGE_NUM,
                source: SOURCE,
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'value' }] });
    });

    it('returns VALUE_MISMATCH when allowedInterchangeNum differs', () => {
        expect(
            Verifier.evm.everstake.unstake(unstakeHex, {
                value: VALUE,
                allowedInterchangeNum: 99,
                source: SOURCE,
            }),
        ).toEqual({
            isValid: false,
            issues: [{ code: 'VALUE_MISMATCH', field: 'allowedInterchangeNum' }],
        });
    });

    it('returns VALUE_MISMATCH when source differs', () => {
        expect(
            Verifier.evm.everstake.unstake(unstakeHex, {
                value: VALUE,
                allowedInterchangeNum: ALLOWED_INTERCHANGE_NUM,
                source: 99n,
            }),
        ).toEqual({ isValid: false, issues: [{ code: 'VALUE_MISMATCH', field: 'source' }] });
    });

    it('returns isValid true when partial checked fields match', () => {
        expect(
            Verifier.evm.everstake.unstake(
                unstakeHex,
                {
                    value: VALUE,
                    allowedInterchangeNum: 99,
                    source: 99n,
                },
                ['value'],
            ),
        ).toEqual({ isValid: true, issues: [] });
    });
});
