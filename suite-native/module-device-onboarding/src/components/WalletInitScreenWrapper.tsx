import { PropsWithChildren } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

export const WalletInitScreenWrapper = ({ children }: PropsWithChildren) => (
    <ConfirmOnTrezorWrapper>
        <VStack spacing="sp32" paddingTop="sp16">
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleDeviceOnboarding.walletCreationScreen.title" />
            </Text>
            <VStack spacing="sp16">{children}</VStack>
        </VStack>
    </ConfirmOnTrezorWrapper>
);
