import { useNavigation } from '@react-navigation/native';

import { Button, Card, TitleHeader, VStack } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.DevUtils>;

export const ComponentDemoCard = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <Card>
            <VStack spacing="sp12">
                <TitleHeader title="Component Demo" />
                <Button onPress={() => navigation.navigate(RootStackRoutes.Storybook)}>
                    Open StoryBook
                </Button>
            </VStack>
        </Card>
    );
};
