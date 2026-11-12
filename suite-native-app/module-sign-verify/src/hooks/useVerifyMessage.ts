import { useNavigation } from '@react-navigation/native';

import {
    type VerifyMessageResult,
    verifyBitcoinMessageThunk,
    verifyEthereumMessageThunk,
} from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { useDeviceReadyEvents } from '@suite-native/device-authorization';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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

    // Mobile has no Suite Native network modules yet, so the network's verification is picked here.
    const verifyMessageByNetwork = (params: VerifyMessageArgs): Promise<VerifyMessageResult> => {
        switch (params.account.networkType) {
            case 'bitcoin':
                return dispatch(verifyBitcoinMessageThunk({ ...params, hex: false }));
            case 'ethereum':
                return dispatch(verifyEthereumMessageThunk({ ...params, hex: false }));
            default:
                return Promise.resolve<VerifyMessageResult>('failed');
        }
    };

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

        const result = await verifyMessageByNetwork({ account, address, message, signature });

        navigation.goBack();

        return result;
    };
};
