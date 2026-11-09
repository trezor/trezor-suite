import { useNavigation } from '@react-navigation/native';

import { Button, Card, TitleHeader, VStack } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.DevUtils>;

export const AppsEmbeddingCard = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <Card>
            <VStack spacing="sp12">
                <TitleHeader
                    title="Apps embedding"
                    subtitle="Playground for testing embedded apps and later on dApps."
                />
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={() => navigation.navigate(RootStackRoutes.AppsEmbedding)}
                    testID="@dev-utils/apps-embedding/open"
                >
                    Open showcase
                </Button>
            </VStack>
        </Card>
    );
};
