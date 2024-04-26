import { useDispatch } from 'react-redux';
import { useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import {
    BottomSheet,
    Text,
    Button,
    IconButton,
    ScreenHeaderWrapper,
    VStack,
} from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

import { cancelPassphraseAndSelectStandardDeviceThunk } from '../passphraseThunks';

type NavigationProp = StackToTabCompositeProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
    gap: 12,
}));

export const PassphraseScreenHeader = () => {
    const route = useRoute();

    const { applyStyle } = useNativeStyles();

    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    const [shouldShowWarningBottomSheet, setShouldShowWarningBottomSheet] = useState(false);

    const handleClose = () => {
        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    const handlePress = () => {
        if (route.name === PassphraseStackRoutes.PassphraseConfirmOnTrezor) {
            setShouldShowWarningBottomSheet(true);
        } else {
            handleClose();
        }
    };

    const handleCloseBottomSheet = () => setShouldShowWarningBottomSheet(false);

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="close"
                size="medium"
                colorScheme="tertiaryElevation1"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handlePress}
            />
            <BottomSheet isVisible={shouldShowWarningBottomSheet} onClose={handleCloseBottomSheet}>
                <VStack justifyContent="center" alignItems="center" padding="small" spacing="large">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="modulePassphrase.confirmOnDevice.warningSheet.title" />
                    </Text>
                    <VStack style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme="redBold" onPress={handleClose}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.primaryButton" />
                        </Button>
                        <Button colorScheme="redElevation0" onPress={handleCloseBottomSheet}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.secondaryButton" />
                        </Button>
                    </VStack>
                </VStack>
            </BottomSheet>
        </ScreenHeaderWrapper>
    );
};
