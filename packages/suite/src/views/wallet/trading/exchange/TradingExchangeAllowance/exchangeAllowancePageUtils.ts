import { type TranslationKey } from '@suite/intl';
import { type ExchangeAllowanceCoverage } from '@suite-common/trading';

type AllowancePageState = {
    coverage: ExchangeAllowanceCoverage;
    hasRevoked: boolean;
};

export const getExchangeAllowanceHeadingId = ({
    coverage,
    hasRevoked,
}: AllowancePageState): TranslationKey => {
    switch (coverage.kind) {
        case 'unlimited':
            return 'TR_EXCHANGE_ALLOWANCE_HEADING_UNLIMITED';
        case 'enough':
            return 'TR_EXCHANGE_ALLOWANCE_HEADING_ENOUGH';
        case 'too_low':
            return 'TR_EXCHANGE_ALLOWANCE_HEADING_TOO_LOW';
        case 'none':
            return hasRevoked
                ? 'TR_EXCHANGE_ALLOWANCE_HEADING_REVOKED'
                : 'TR_EXCHANGE_ALLOWANCE_HEADING_NONE';
    }
};

export const getExchangeAllowanceDescriptionId = ({
    kind,
    requiresReset,
}: ExchangeAllowanceCoverage): TranslationKey => {
    switch (kind) {
        case 'unlimited':
        case 'enough':
            return 'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_SWAP';
        case 'too_low':
            return requiresReset
                ? 'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_RESET'
                : 'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_APPROVE';
        case 'none':
            return 'TR_EXCHANGE_ALLOWANCE_NEXT_STEP_APPROVE';
    }
};
