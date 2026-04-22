import React from 'react';

import { CheckBox, FullAlertBox, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const TxSimulationBanner = ({
    title,
    description,
    type = 'error',
    disclaimerAccepted,
    setDisclaimerAccepted,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    type: 'error' | 'warning';
    disclaimerAccepted: boolean;
    setDisclaimerAccepted: (value: boolean) => void;
}) => (
    <>
        <FullAlertBox
            variant={type === 'warning' ? 'warning' : 'critical'}
            title={title}
            description={description}
        />
        <PressableOpacity onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}>
            <HStack spacing="sp16" padding="sp8" alignItems="center">
                <CheckBox
                    isChecked={disclaimerAccepted}
                    onChange={() => setDisclaimerAccepted(!disclaimerAccepted)}
                />
                <Text color="contentSecondary" variant="body-sm">
                    <Translation id="moduleConnectPopup.simulation.disclaimerOverride" />
                </Text>
            </HStack>
        </PressableOpacity>
    </>
);
