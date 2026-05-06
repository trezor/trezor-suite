import { type RewardDtoYieldSource } from '@suite-common/earn-stablecoin-api';
import { type TxKeyPath } from '@suite-native/intl';

export const getApyBreakdownDescriptionKey = (
    yieldSource: RewardDtoYieldSource,
): TxKeyPath | null => {
    switch (yieldSource) {
        case 'protocol_incentive':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.manualCompound';
        case 'lending_interest':
        default:
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.autoCompounded';
    }
};
