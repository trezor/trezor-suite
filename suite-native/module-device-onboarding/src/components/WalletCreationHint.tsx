import { ReactNode } from 'react';
import { FadeInDown } from 'react-native-reanimated';

import { AccordionList, AnimatedCard, Text } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';

const AccordionContentText = ({ translationKey }: { translationKey: TxKeyPath }) => (
    <Text variant="hint">
        <Translation id={translationKey} />
    </Text>
);

const accordionItems = [
    {
        title: <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion1.title" />,
        content: (
            <AccordionContentText translationKey="moduleDeviceOnboarding.walletCreationScreen.accordion1.content" />
        ),
        iconName: 'newspaper',
    },
    {
        title: <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion2.title" />,
        content: (
            <AccordionContentText translationKey="moduleDeviceOnboarding.walletCreationScreen.accordion2.content" />
        ),
        iconName: 'pencilSimple',
    },
    {
        title: <Translation id="moduleDeviceOnboarding.walletCreationScreen.accordion3.title" />,
        content: (
            <AccordionContentText translationKey="moduleDeviceOnboarding.walletCreationScreen.accordion3.content" />
        ),
        iconName: 'magnifyingGlass',
    },
] as const satisfies { title: ReactNode; content: ReactNode; iconName: IconName }[];

export const WalletCreationHint = () => (
    <AnimatedCard entering={FadeInDown} style={{ paddingBottom: 8 }}>
        <AccordionList items={accordionItems} />
    </AnimatedCard>
);
