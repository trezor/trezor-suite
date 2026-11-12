import { useNavigation } from '@react-navigation/native';

import {
    type SignedMessage,
    signBitcoinMessageThunk,
    signCardanoMessageThunk,
    signEthereumMessageThunk,
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

    // Mobile has no Suite Native network modules yet, so the network's signing is picked here.
    const signMessageByNetwork = ({
        account,
        format,
        path,
        message,
        hex,
    }: SignMessageArgs): Promise<SignedMessage | false> => {
        switch (account.networkType) {
            case 'bitcoin':
                return dispatch(
                    signBitcoinMessageThunk({
                        account,
                        path,
                        message,
                        hex,
                        isElectrum: format === 'electrum',
                    }),
                );
            case 'ethereum':
                return dispatch(signEthereumMessageThunk({ account, message, hex }));
            case 'cardano':
                return dispatch(
                    signCardanoMessageThunk({
                        account,
                        path,
                        message,
                        hex,
                        isCose: format === 'cose',
                    }),
                );
            default:
                return Promise.resolve<false>(false);
        }
    };

    return async ({ account, format, path, message, hex }: SignMessageArgs) => {
        navigation.navigate(RootStackRoutes.SignAndVerifyStack);

        const isDeviceReady = await waitForDevice();
        if (!isDeviceReady) {
            return false;
        }

        const result = await signMessageByNetwork({ account, format, path, message, hex });

        navigation.goBack();

        return result;
    };
};
