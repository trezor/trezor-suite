import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    deviceActions,
    selectDevice,
    selectDeviceButtonRequestsCodes,
} from '@suite-common/wallet-core';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

// When device is in view only mode and is reconnected, passphrase is not requested after reconnecting
// but when the app interacts with the device (e.g. requesting address / validating transaction, etc).
// To make the passphrase working on this feature, just use this hook in the component that will interact with the device
// and add the features button request code to the useEffect that redirects back to the flow
// after successfull passphrase submission.
export const useFeatureRequestsPassphrase = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const device = useSelector(selectDevice);
    const buttonRequestCodes = useSelector(selectDeviceButtonRequestsCodes);

    useEffect(() => {
        if (
            buttonRequestCodes.includes('ButtonRequest_Address') &&
            buttonRequestCodes.includes('ButtonRequest_Other') &&
            navigation.canGoBack()
        ) {
            navigation.goBack();
            dispatch(
                deviceActions.removeButtonRequests({
                    device,
                    buttonRequestCode: 'ButtonRequest_Other',
                }),
            );
        }
    }, [buttonRequestCodes, device, dispatch, navigation]);
};
