import { RouteProp, useRoute } from '@react-navigation/native';

import { ReceiveAccount } from '@suite-native/receive';
import {
    Screen,
    ReceiveStackParamList,
    ReceiveStackRoutes,
    ScreenSubHeader,
} from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

export const ReceiveScreen = () => {
    const route = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.Receive>>();
    const { accountKey, tokenContract } = route.params;
    const { translate } = useTranslate();

    return (
        <Screen subheader={<ScreenSubHeader content={translate('moduleReceive.title')} />}>
            <ReceiveAccount accountKey={accountKey} tokenContract={tokenContract} />
        </Screen>
    );
};
