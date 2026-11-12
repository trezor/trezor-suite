import { useNavigation } from '@react-navigation/native';

import { signThunk } from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import type { SignSelection } from '@trezor/network-module-suite-common-types';
import { injectDispatch } from '@trezor/redux-utils';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type SignMessageArgs = {
    account: Account;
    selection?: SignSelection;
    path: string;
    message: string;
    hex: boolean;
};

export const useSignMessage = () => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const { dispatch } = useServices(injectDispatch);

    return async ({ account, selection, path, message, hex }: SignMessageArgs) => {
        navigation.navigate(RootStackRoutes.SignAndVerifyStack);

        const isDeviceReady = await waitForDevice();
        if (!isDeviceReady) {
            return false;
        }

        const result = await dispatch(signThunk({ account, path, message, isHex: hex, selection }));

        navigation.goBack();

        return result;
    };
};
