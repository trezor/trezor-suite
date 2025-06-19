import { Screen, SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { CoinControlScreenFooter } from '../components/SendUtxoScreenFooter';
import { CoinControlScreenHeader } from '../components/SendUtxoScreenHeader';
import { UtxoList } from '../components/UtxoList';

export const SendUtxoScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendUtxo>) => {
    const { accountKey } = params;

    return (
        <Screen header={<CoinControlScreenHeader />} footer={<CoinControlScreenFooter />}>
            <UtxoList accountKey={accountKey} />
        </Screen>
    );
};
