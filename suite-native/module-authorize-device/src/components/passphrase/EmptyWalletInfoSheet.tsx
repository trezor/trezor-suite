import { useNavigation } from '@react-navigation/native';

import {
    AlertBox,
    BottomSheet,
    BottomSheetListItem,
    Box,
    Button,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type EmptyWalletInfoSheetProps = {
    onClose: () => void;
    isVisible: boolean;
};

const bottomSheetStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.large,
    paddingTop: utils.spacings.small,
}));

const bottomSheetBottomStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    gap: utils.spacings.large,
    padding: 0,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseEmptyWallet,
    RootStackParamList
>;

export const EmptyWalletInfoSheet = ({ onClose, isVisible }: EmptyWalletInfoSheetProps) => {
    const navigation = useNavigation<NavigationProp>();

    const { applyStyle } = useNativeStyles();

    const handleOpenEmptyWallet = () => {
        navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseVerifyEmptyWallet);
        onClose();
    };

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            isCloseDisplayed={false}
            style={applyStyle(bottomSheetStyle)}
        >
            <TitleHeader
                textAlign="left"
                title={
                    <Translation id="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.title" />
                }
            />
            <VStack alignItems="center" spacing="large" padding="small">
                <BottomSheetListItem
                    iconName="pencilUnderscored"
                    translationKey="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.list.backup"
                    iconSize="medium"
                    iconBackgroundColor="backgroundTertiaryDefaultOnElevation0"
                    iconBorderColor="borderElevation0"
                />
                <BottomSheetListItem
                    iconName="copy"
                    translationKey="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.list.store"
                    iconSize="medium"
                    iconBackgroundColor="backgroundTertiaryDefaultOnElevation0"
                    iconBorderColor="borderElevation0"
                />
                <BottomSheetListItem
                    iconName="eyeSlashLight"
                    translationKey="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.list.neverShare"
                    iconSize="medium"
                    iconBackgroundColor="backgroundTertiaryDefaultOnElevation0"
                    iconBorderColor="borderElevation0"
                />
            </VStack>
            <VStack style={applyStyle(bottomSheetBottomStyle)}>
                <AlertBox
                    variant="warning"
                    title={
                        <Text color="textDefault" variant="callout">
                            <Translation id="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.alertTitle" />
                        </Text>
                    }
                />
                <Box style={applyStyle(buttonWrapperStyle)}>
                    <Button onPress={handleOpenEmptyWallet}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
