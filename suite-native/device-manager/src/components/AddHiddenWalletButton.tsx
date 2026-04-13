import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { runDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const AddHiddenWalletButton = () => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const device = useSelector(selectSelectedDevice);

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        if (!device) return;
        setIsDeviceManagerVisible(false);

        analytics.report({ type: events.passphraseAddHiddenWalletEvent.name });
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            }),
        );
        dispatch(runDiscoveryThunk(device));

        navigation.navigate(RootStackRoutes.PassphraseStack, {
            screen: PassphraseStackRoutes.PassphraseForm,
        });
    };

    return (
        <Button
            intent="neutral"
            priority="secondary"
            iconLeft="password"
            onPress={handleAddHiddenWallet}
            testID="@device-manager/passphrase/add"
        >
            <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
        </Button>
    );
};
