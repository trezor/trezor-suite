import { Box, Button, Card, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { PassphraseMismatchAlert } from './PassphraseMismatchAlert';

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
                        <Button onPress={onCancel} intent="critical" priority="secondary">
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    </Box>
                </VStack>
            </Card>
            <PassphraseMismatchAlert />
        </>
    );
};
