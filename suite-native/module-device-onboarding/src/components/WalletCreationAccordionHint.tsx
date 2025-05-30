import { ReactNode, useEffect, useState } from 'react';
import { FadeInDown } from 'react-native-reanimated';

import { AccordionList, AnimatedCard, Text } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp8,
}));

const SHOW_ACCORDION_DELAY = 5000;

const accordionItems = [
    {
        title: <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion1.title" />,
        content: (
            <Text variant="hint">
                <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion1.content" />
            </Text>
        ),
        iconName: 'newspaper',
    },
    {
        title: <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion2.title" />,
        content: (
            <Text variant="hint">
                <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion2.content" />
            </Text>
        ),
        iconName: 'pencilSimple',
    },
    {
        title: <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion3.title" />,
        content: (
            <Text variant="hint">
                <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion3.content" />
            </Text>
        ),
        iconName: 'magnifyingGlass',
    },
] as const satisfies { title: ReactNode; content: ReactNode; iconName: IconName }[];

export const WalletCreationAccordionHint = () => {
    const { applyStyle } = useNativeStyles();

    const [isDisplayed, setIsDisplayed] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsDisplayed(true);
        }, SHOW_ACCORDION_DELAY);

        return () => clearTimeout(timeout);
    }, []);

    if (!isDisplayed) return null;

    return (
        <AnimatedCard entering={FadeInDown} style={applyStyle(cardStyle)}>
            <AccordionList items={accordionItems} />
        </AnimatedCard>
    );
};
