import { type ExchangeAllowanceCoverage } from '@suite-common/trading';

import {
    getExchangeAllowanceDescriptionId,
    getExchangeAllowanceHeadingId,
} from './exchangeAllowancePageUtils';

const getCoverage = (
    coverage: Partial<ExchangeAllowanceCoverage> = {},
): ExchangeAllowanceCoverage => ({
    kind: 'none',
    coveredRatio: 0,
    requiresReset: false,
    ...coverage,
});

describe('exchangeAllowancePageUtils', () => {
    it.each<[string, ExchangeAllowanceCoverage, string, string]>([
        [
            'unlimited',
            getCoverage({ kind: 'unlimited' }),
            'TR_EXCHANGE_ALLOWANCE_HEADING_UNLIMITED',
            'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_SWAP',
        ],
        [
            'enough',
            getCoverage({ kind: 'enough' }),
            'TR_EXCHANGE_ALLOWANCE_HEADING_ENOUGH',
            'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_SWAP',
        ],
        [
            'too low with an increase',
            getCoverage({ kind: 'too_low' }),
            'TR_EXCHANGE_ALLOWANCE_HEADING_TOO_LOW',
            'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_APPROVE',
        ],
        [
            'too low with a reset',
            getCoverage({ kind: 'too_low', requiresReset: true }),
            'TR_EXCHANGE_ALLOWANCE_HEADING_TOO_LOW',
            'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_RESET',
        ],
        [
            'none',
            getCoverage(),
            'TR_EXCHANGE_ALLOWANCE_HEADING_NONE',
            'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_APPROVE',
        ],
    ])('describes the %s allowance', (_, coverage, headingId, descriptionId) => {
        expect(getExchangeAllowanceHeadingId({ coverage, hasRevoked: false })).toBe(headingId);
        expect(getExchangeAllowanceDescriptionId(coverage)).toBe(descriptionId);
    });

    it('confirms the revoke once nothing is left', () => {
        expect(getExchangeAllowanceHeadingId({ coverage: getCoverage(), hasRevoked: true })).toBe(
            'TR_EXCHANGE_ALLOWANCE_HEADING_REVOKED',
        );
    });

    it('keeps the allowance heading while the revoke is not yet reflected', () => {
        expect(
            getExchangeAllowanceHeadingId({
                coverage: getCoverage({ kind: 'enough' }),
                hasRevoked: true,
            }),
        ).toBe('TR_EXCHANGE_ALLOWANCE_HEADING_ENOUGH');
    });
});
