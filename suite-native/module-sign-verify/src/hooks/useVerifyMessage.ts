import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type VerifyMessageResult, verifyThunk } from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type VerifyMessageArgs = {
    account: Account;
    address: string;
    message: string;
    signature: string;
};

export const useVerifyMessage = () => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const { dispatch } = useServices(injectDispatch);

    return async ({
        account,
        address,
        message,
        signature,
    }: VerifyMessageArgs): Promise<VerifyMessageResult> => {
        navigation.navigate(RootStackRoutes.SignAndVerifyStack);

        const isDeviceReady = await waitForDevice();
        if (!isDeviceReady) {
            return 'cancelled';
        }

        const result = await dispatch(verifyThunk(account, address, message, signature));

        navigation.goBack();

        return result;
    };
};
