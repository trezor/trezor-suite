import { Box, Button, Card, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { PassphraseMismatchAlert } from './PassphraseMismatchAlert';
import { useRedirectOnPassphraseCompletion } from '../useRedirectOnPassphraseCompletion';

const buttonWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const cardStyle = prepareNativeStyle(_ => ({
    paddingTop: 28,
}));

type PassphraseEnterOnTrezorScreenContentProps = {
    onCancel: () => void;
};

export const PassphraseEnterOnTrezorScreenContent = ({
    onCancel,
}: PassphraseEnterOnTrezorScreenContentProps) => {
    const { applyStyle } = useNativeStyles();

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    useRedirectOnPassphraseCompletion();

    const handleCancel = () => {
        onCancel();
    };

    return (
        <>
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing={28}>
                    <VStack justifyContent="center" alignItems="center" spacing="sp24">
                        <ConfirmOnTrezorAnimation />
                        <CenteredTitleHeader
                            title={
                                <Translation id="modulePassphrase.enterPassphraseOnTrezor.title" />
                            }
                            subtitle={
                                <Translation id="modulePassphrase.enterPassphraseOnTrezor.subtitle" />
                            }
                        />
                    </VStack>
                    <Box style={applyStyle(buttonWrapperStyle)}>
                        <Button onPress={handleCancel} colorScheme="redElevation1">
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    </Box>
                </VStack>
            </Card>
            <PassphraseMismatchAlert />
        </>
    );
};
