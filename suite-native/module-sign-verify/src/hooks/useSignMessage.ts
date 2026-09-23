import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { signThunk } from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

export type SignatureFormat = 'default' | 'electrum' | 'cose';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type SignMessageArgs = {
    account: Account;
    format: SignatureFormat;
    path: string;
    message: string;
    hex: boolean;
};

export const useSignMessage = () => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const { dispatch } = useServices(injectDispatch);

    return async ({ account, format, path, message, hex }: SignMessageArgs) => {
        navigation.navigate(RootStackRoutes.SignAndVerifyStack);

        const isDeviceReady = await waitForDevice();
        if (!isDeviceReady) {
            return false;
        }

        const result = await dispatch(
            signThunk(account, path, message, hex, format === 'electrum', format === 'cose'),
        );

        navigation.goBack();

        return result;
    };
};
