import { Pressable, Text } from 'react-native';

import {
    NavigationContainer,
    NavigationIndependentTree,
    createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { useCloseTradingFlow } from './useCloseTradingFlow';

type RootParamList = {
    Tabs: undefined;
    Flow: { screen: 'Preview' | 'Review' };
};

const RootStack = createNativeStackNavigator();
const FlowStack = createNativeStackNavigator();

let shouldInterceptRemove = false;

const ReviewScreen = () => {
    const closeTradingFlow = useCloseTradingFlow();
    useNavigationRemoveActionInterceptor({ isEnabled: shouldInterceptRemove });

    return (
        <Pressable onPress={closeTradingFlow}>
            <Text>close</Text>
        </Pressable>
    );
};
const PreviewScreen = () => <Text>preview</Text>;
const TabsScreen = () => <Text>tabs</Text>;
const FlowNavigator = () => (
    <FlowStack.Navigator>
        <FlowStack.Screen name="Preview" component={PreviewScreen} />
        <FlowStack.Screen name="Review" component={ReviewScreen} />
    </FlowStack.Navigator>
);

describe('useCloseTradingFlow', () => {
    const renderNavigationWithFlowOpened = async () => {
        const navigationRef = createNavigationContainerRef<RootParamList>();

        const renderResult = await renderWithBasicProvider(
            <NavigationIndependentTree>
                <NavigationContainer ref={navigationRef}>
                    <RootStack.Navigator>
                        <RootStack.Screen name="Tabs" component={TabsScreen} />
                        <RootStack.Screen name="Flow" component={FlowNavigator} />
                    </RootStack.Navigator>
                </NavigationContainer>
            </NavigationIndependentTree>,
        );
        await act(() => navigationRef.navigate('Flow', { screen: 'Preview' }));
        await act(() => navigationRef.navigate('Flow', { screen: 'Review' }));

        return { navigationRef, ...renderResult };
    };

    beforeEach(() => {
        shouldInterceptRemove = false;
    });

    it('leaves the whole nested flow instead of rewinding it', async () => {
        const { navigationRef, getByText } = await renderNavigationWithFlowOpened();

        await fireEvent.press(getByText('close'));

        expect(navigationRef.getRootState().routes.map(route => route.name)).toEqual(['Tabs']);
    });

    it('leaves the whole flow when a screen re-dispatches the allowed remove action', async () => {
        shouldInterceptRemove = true;
        const { navigationRef, getByText } = await renderNavigationWithFlowOpened();

        await fireEvent.press(getByText('close'));

        expect(navigationRef.getRootState().routes.map(route => route.name)).toEqual(['Tabs']);
    });
});
