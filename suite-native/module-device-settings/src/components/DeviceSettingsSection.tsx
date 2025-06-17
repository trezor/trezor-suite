import { Children, ReactNode } from 'react';

import { A, G } from '@mobily/ts-belt';

import { Text, VStack } from '@suite-native/atoms';

type DeviceSettingsSectionProps = {
    title: ReactNode;
    children: ReactNode;
};

export const DeviceSettingsSection = ({ title, children }: DeviceSettingsSectionProps) => {
    // If children elements are conditionally rendered and section would end up being empty, avoid rendering the whole section.
    const validChildren = Children.toArray(children).filter(child => G.isNotNullable(child));

    if (A.isEmpty(validChildren)) {
        return null;
    }

    return (
        <VStack spacing="sp16">
            <Text variant="titleSmall" color="textOnTertiary">
                {title}
            </Text>
            {children}
        </VStack>
    );
};
