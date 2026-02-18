import { Button, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { CreateSecureConnectionAnimation } from './CreateSecureConnectionAnimation';

type ThpPairingInfoScreenContentProps = {
    onContinue: () => void;
};

export const ThpPairingInfoScreenContent = ({ onContinue }: ThpPairingInfoScreenContentProps) => (
    <VStack flex={1} justifyContent="space-between">
        <VStack marginTop="sp16" spacing="sp64" alignItems="center">
            <CenteredTitleHeader
                title={<Translation id="thp.pairingInfo.title" />}
                titleVariant="headline-md"
                subtitle={<Translation id="thp.pairingInfo.subtitle" />}
            />
            <CreateSecureConnectionAnimation />
        </VStack>
        <Button onPress={onContinue}>
            <Translation id="generic.buttons.continue" />
        </Button>
    </VStack>
);
