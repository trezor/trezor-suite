import { type RewardDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type TxKeyPath } from '@suite-native/intl';

export const getApyBreakdownDescriptionKey = (
    yieldSource: RewardDtoV2['yieldSource'],
): TxKeyPath | null => {
    switch (yieldSource) {
        case 'protocol_incentive':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.manualCompound';
        default:
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.autoCompounded';
    }
};
