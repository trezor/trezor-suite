import { Card, Text, VStack } from '@suite-native/atoms';

import { EarnEnvironmentSelect } from './EarnEnvironmentSelect';

export const EarnCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="headline-sm">Earn</Text>
            <EarnEnvironmentSelect />
        </VStack>
    </Card>
);
