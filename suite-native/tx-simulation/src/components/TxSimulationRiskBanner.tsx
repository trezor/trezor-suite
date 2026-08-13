import { type ReactNode } from 'react';

import { BannerFull, CheckBox, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TxSimulationRiskBannerProps = {
    description?: ReactNode;
    disclaimerAccepted: boolean;
    setDisclaimerAccepted: (value: boolean) => void;
    title: ReactNode;
    intent: 'critical' | 'warning';
};

export const TxSimulationRiskBanner = ({
    description,
    disclaimerAccepted,
    setDisclaimerAccepted,
    title,
    intent,
}: TxSimulationRiskBannerProps) => (
    <>
        <BannerFull intent={intent} title={title} description={description} />
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
