import { RouteProp, useRoute } from '@react-navigation/native';

import { RootStackParamList, RootStackRoutes, Screen } from '@suite-native/navigation';

import { StakingDetailScreenHeader } from '../components/StakingDetailScreenHeader';
import { StakingInfo } from '../components/StakingInfo';

export const StakingDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingDetail>>();
    const { accountKey } = route.params;

    return (
        <Screen screenHeader={<StakingDetailScreenHeader />}>
            <StakingInfo accountKey={accountKey} />
        </Screen>
    );
};
