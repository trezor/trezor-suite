import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { EarnDeviceConnectionGuard } from '../../components/earn/EarnDeviceConnectionGuard';
import { StakingTransactionDataReviewContent } from '../../components/staking/StakingTransactionDataReviewContent';

type StakingTransactionDataReviewScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.StakingTransactionDataReview
>;

export const StakingTransactionDataReviewScreen = ({
    route,
}: StakingTransactionDataReviewScreenProps) => {
    const { accountKey, stakeType, amount } = route.params;

    return (
        <EarnDeviceConnectionGuard>
            <StakingTransactionDataReviewContent
                accountKey={accountKey}
                amount={amount}
                stakeType={stakeType}
            />
        </EarnDeviceConnectionGuard>
    );
};
