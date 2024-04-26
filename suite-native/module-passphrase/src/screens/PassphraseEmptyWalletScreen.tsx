import { DimensionValue } from 'react-native';
import { useState } from 'react';

import { Screen } from '@suite-native/navigation';
import { VStack, Card, Text, Image, Button, Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { EmptyWalletInfoSheet } from '../components/EmptyWalletInfoSheet';

const imageStyle = prepareNativeStyle(() => ({
    width: 124.45,
    height: 96,
    alignSelf: 'center',
}));

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
}));

const cardContentStyle = prepareNativeStyle(() => ({
    padding: 54,
}));

const retryButtonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const textStyle = prepareNativeStyle<{ widthPercentage: number }>((_, { widthPercentage }) => ({
    width: `${widthPercentage}%` as DimensionValue,
}));

export const PassphraseEmptyWalletScreen = () => {
    const { applyStyle } = useNativeStyles();

    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const toggleBottomSheet = () => {
        setIsSheetVisible(!isSheetVisible);
    };

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack spacing="large">
                <Text variant="titleMedium" style={applyStyle(textStyle, { widthPercentage: 90 })}>
                    <Translation id="modulePassphrase.emptyPassphraseWallet.title" />
                </Text>
                <Card style={applyStyle(cardStyle)}>
                    <VStack
                        alignItems="center"
                        spacing="medium"
                        style={applyStyle(cardContentStyle)}
                    >
                        <Image
                            source={require('../assets/questionMarks.png')}
                            style={applyStyle(imageStyle)}
                        />
                        <Text variant="highlight" textAlign="center">
                            <Translation id="modulePassphrase.emptyPassphraseWallet.confirmCard.description" />
                        </Text>
                    </VStack>
                    <Button onPress={toggleBottomSheet}>
                        <Translation id="modulePassphrase.emptyPassphraseWallet.confirmCard.button" />
                    </Button>
                </Card>
                {/* TODO https://github.com/trezor/trezor-suite/issues/12207 */}
                <Text>OR</Text>
                <VStack spacing={20}>
                    <VStack alignItems="center" spacing="extraSmall">
                        <Text
                            textAlign="center"
                            variant="highlight"
                            style={applyStyle(textStyle, { widthPercentage: 80 })}
                        >
                            <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.title" />
                        </Text>
                        <Text
                            variant="hint"
                            color="textSubdued"
                            textAlign="center"
                            style={applyStyle(textStyle, { widthPercentage: 70 })}
                        >
                            <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.description" />
                        </Text>
                    </VStack>
                    <Box style={applyStyle(retryButtonWrapperStyle)}>
                        <Button colorScheme="tertiaryElevation0">
                            <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.button" />
                        </Button>
                    </Box>
                </VStack>
            </VStack>
            <EmptyWalletInfoSheet isVisible={isSheetVisible} onClose={toggleBottomSheet} />
        </Screen>
    );
};
