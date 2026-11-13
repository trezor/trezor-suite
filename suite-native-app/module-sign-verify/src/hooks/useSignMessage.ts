import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type DeviceRootState,
    isTrezorDeviceWithState,
    selectSelectedDevice,
} from '@suite-common/device';
import { injectSignVerify } from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { type SignatureFormat } from '@trezor/network-module-suite-common-types';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type SignMessageArgs = {
    account: Account;
    format?: SignatureFormat;
    path: string;
    message: string;
    hex: boolean;
};

export const useSignMessage = () => {
    const navigation = useNavigation<NavigationProps>();
    const { waitForDevice } = useDeviceReadyEvents();
    const { signVerify } = useServices(injectSignVerify);
    const store = useStore<DeviceRootState>();

    return async ({ account, format, path, message, hex }: SignMessageArgs) => {
        navigation.navigate(RootStackRoutes.SignVerifyStack);

        const isDeviceReady = await waitForDevice();
        // Read after waiting: the device may have connected while the user was asked for it.
        const device = selectSelectedDevice(store.getState());
        if (!isDeviceReady || !isTrezorDeviceWithState(device)) {
            return false;
        }

        const result = await signVerify.sign({
            device,
            account,
            path,
            message,
            hex,
            format,
        });

        navigation.goBack();

        return result.success ? result.payload : false;
    };
};
