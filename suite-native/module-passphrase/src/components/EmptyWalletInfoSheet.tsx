import { useNavigation } from '@react-navigation/native';

import { Icon, IconName } from '@suite-common/icons';
import { TxKeyPath } from '@suite-native/intl';
import {
    AlertBox,
    BottomSheet,
    Box,
    Button,
    HStack,
    Pictogram,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type EmptyWalletInfoSheetProps = {
    onClose: () => void;
    isVisible: boolean;
};

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const listItemStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

const ListItem = ({
    iconName,
    translationKey,
}: {
    iconName: IconName;
    translationKey: TxKeyPath;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing={20}>
            <Icon name={iconName} />
            <Text style={applyStyle(listItemStyle)}>
                <Translation id={translationKey} />
            </Text>
        </HStack>
    );
};

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseEmptyWallet,
    RootStackParamList
>;

export const EmptyWalletInfoSheet = ({ onClose, isVisible }: EmptyWalletInfoSheetProps) => {
    const navigation = useNavigation<NavigationProp>();

    const { applyStyle } = useNativeStyles();

    const handleOpenEmptyWallet = () => {
        navigation.navigate(PassphraseStackRoutes.PassphraseVerifyEmptyWallet);
        onClose();
    };

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} isCloseDisplayed={false}>
            <VStack alignItems="center" spacing="large" padding="medium">
                <Pictogram variant="yellow" icon="warningTriangleLight" />
                <VStack spacing="medium">
                    <Text variant="titleSmall">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.title" />
                    </Text>
                    <VStack spacing={12}>
                        <ListItem
                            iconName="pencilUnderscored"
                            translationKey="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.list.backup"
                        />
                        <ListItem
                            iconName="copy"
                            translationKey="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.list.store"
                        />
                        <ListItem
                            iconName="eyeSlashLight"
                            translationKey="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.list.neverShare"
                        />
                    </VStack>
                    <AlertBox
                        variant="warning"
                        title={
                            <Translation id="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.alertTitle" />
                        }
                    />
                </VStack>
                <Box style={applyStyle(buttonWrapperStyle)}>
                    <Button onPress={handleOpenEmptyWallet}>
                        <Translation id="modulePassphrase.emptyPassphraseWallet.confirmEmptyWalletSheet.button" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
