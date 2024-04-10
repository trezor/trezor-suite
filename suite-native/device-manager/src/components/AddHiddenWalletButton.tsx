import { useNavigation } from '@react-navigation/native';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { PassphraseStackRoutes, RootStackRoutes } from '@suite-native/navigation';

import { useDeviceManager } from '../hooks/useDeviceManager';

export const AddHiddenWalletButton = () => {
    const navigation = useNavigation();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleAddHiddenWallet = () => {
        setIsDeviceManagerVisible(false);

        navigation.navigate(RootStackRoutes.PassphraseStack, {
            screen: PassphraseStackRoutes.PassphraseForm,
        });

        // await dispatch(createDeviceInstance({ device: instance }));
    };

    return (
        <Button colorScheme="tertiaryElevation1" onPress={handleAddHiddenWallet}>
            <Translation id="deviceManager.deviceButtons.addHiddenWallet" />
        </Button>
    );
};
