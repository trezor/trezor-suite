import { type RewardDtoYieldSource } from '@suite-common/earn-stablecoin-api';
import { type TxKeyPath } from '@suite-native/intl';

export const getApyBreakdownDescriptionKey = (
    yieldSource: RewardDtoYieldSource,
): TxKeyPath | null => {
    switch (yieldSource) {
        case 'lending_interest':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.autoCompounded';
        case 'protocol_incentive':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.manualCompound';
        default:
            return null;
    }
};
