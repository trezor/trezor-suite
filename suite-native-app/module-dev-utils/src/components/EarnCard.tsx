import { Card, Text, VStack } from '@suite-native/atoms';

import { EarnEnvironmentSelect } from './EarnEnvironmentSelect';
import { EarnStakingEnvironmentSelect } from './EarnStakingEnvironmentSelect';

export const EarnCard = () => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="headline-sm">Earn</Text>
            <EarnEnvironmentSelect />
            <EarnStakingEnvironmentSelect />
        </VStack>
    </Card>
);
