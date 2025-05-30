import { ReactNode } from 'react';

import { AccordionList, Box, Card, Text, VStack } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp8,
}));

const accordionItems = [
    {
        iconName: 'scroll',
        title: <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion1.title" />,
        content: (
            <Text variant="hint">
                <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion1.content" />
            </Text>
        ),
    },
    {
        iconName: 'textAa',
        title: <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion2.title" />,
        content: (
            <VStack spacing="sp24">
                <Box>
                    <Text variant="callout">
                        <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion2.paragraph1.header" />
                    </Text>
                    <Text variant="hint">
                        <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion2.paragraph1.content" />
                    </Text>
                </Box>
                <Box>
                    <Text variant="highlight">
                        <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion2.paragraph2.header" />
                    </Text>
                    <Text variant="hint">
                        <Translation id="moduleDeviceOnboarding.walletRecoveryScreen.accordion2.paragraph2.content" />
                    </Text>
                </Box>
            </VStack>
        ),
    },
] as const satisfies { title: ReactNode; content: ReactNode; iconName: IconName }[];

export const WalletRecoveryAccordionHint = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(cardStyle)}>
            <AccordionList items={accordionItems} />
        </Card>
    );
};
