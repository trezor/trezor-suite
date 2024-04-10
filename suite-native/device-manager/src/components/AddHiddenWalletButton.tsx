import { useNavigation } from '@react-navigation/native';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';

import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const AddHiddenWalletButton = () => {
    const navigation = useNavigation<NavigationProp>();

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
