import { PropsWithChildren } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const WalletInitScreenWrapper = ({ children }: PropsWithChildren) => (
    <DeviceOnboardingScreenWithExitButton footer={<ConfirmOnTrezorImage />}>
        <VStack spacing="sp32" paddingTop="sp16">
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleDeviceOnboarding.walletCreationScreen.title" />
            </Text>
            <VStack spacing="sp16">{children}</VStack>
        </VStack>
    </DeviceOnboardingScreenWithExitButton>
);
