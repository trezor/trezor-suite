import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CheckBox, FullAlertBox, HStack, Text } from '@suite-native/atoms';
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
        <TouchableOpacity onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}>
            <HStack spacing="sp16" padding="sp8" alignItems="center">
                <CheckBox
                    isChecked={disclaimerAccepted}
                    onChange={() => setDisclaimerAccepted(!disclaimerAccepted)}
                />
                <Text color="textSubdued" variant="hint">
                    <Translation id="moduleConnectPopup.simulation.disclaimerOverride" />
                </Text>
            </HStack>
        </TouchableOpacity>
    </>
);
