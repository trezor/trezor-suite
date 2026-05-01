import { type ReactNode } from 'react';

import { HStack, OrderedListIcon, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type HowEarnWorksBenefitItem = {
    id: string;
    icon: IconName;
    title: ReactNode;
    description: ReactNode;
};

type HowEarnWorksBenefitsSectionProps = {
    items: HowEarnWorksBenefitItem[];
};

const benefitRowStyle = prepareNativeStyle(() => ({
    width: '100%',
    alignItems: 'flex-start',
}));

const benefitTextContainerStyle = prepareNativeStyle(() => ({
    flex: 1,
    minWidth: 0,
}));

const benefitTitleStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

const benefitDescriptionStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const HowEarnWorksBenefitsSection = ({ items }: HowEarnWorksBenefitsSectionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp16">
            {items.map(item => (
                <HStack key={item.id} spacing="sp12" style={applyStyle(benefitRowStyle)}>
                    <OrderedListIcon
                        iconName={item.icon}
                        iconSize="large"
                        iconColor="contentBrand"
                        iconBackgroundColor="legacyBackgroundPrimarySubtleOnElevation1"
                        iconBorderColor="legacyBackgroundPrimarySubtleOnElevationNegative"
                    />
                    <VStack spacing={0} style={applyStyle(benefitTextContainerStyle)}>
                        <Text variant="body-md-strong" style={applyStyle(benefitTitleStyle)}>
                            {item.title}
                        </Text>
                        <Text
                            variant="body-sm"
                            color="contentSecondary"
                            style={applyStyle(benefitDescriptionStyle)}
                        >
                            {item.description}
                        </Text>
                    </VStack>
                </HStack>
            ))}
        </VStack>
    );
};
