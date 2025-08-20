import { Button, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { CreateSecureConnectionSvg } from '../assets/CreateSecureConnectionSvg';

type ThpPairingInfoScreenContentProps = {
    onContinue: () => void;
};

export const ThpPairingInfoScreenContent = ({ onContinue }: ThpPairingInfoScreenContentProps) => (
    <VStack flex={1} justifyContent="space-between">
        <VStack marginTop="sp16" spacing="sp64" alignItems="center">
            <CenteredTitleHeader
                title={<Translation id="thp.pairingInfo.title" />}
                titleVariant="titleMedium"
                subtitle={<Translation id="thp.pairingInfo.subtitle" />}
            />
            <CreateSecureConnectionSvg />
        </VStack>
        <Button onPress={onContinue}>
            <Translation id="generic.buttons.continue" />
        </Button>
    </VStack>
);
