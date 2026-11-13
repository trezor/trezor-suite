import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import {
    type NativeStackNavigationProp,
    createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldPositionFlowType } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { act, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { YieldFlowExitAnalyticsProvider } from './YieldFlowExitAnalyticsProvider';
import { useYieldFormExitAnalytics } from '../../hooks/yield/useYieldFlowAnalytics';

type StepParams = { flowType: YieldPositionFlowType; isCompleted?: boolean };
type FlowStackParams = {
    Info: undefined;
    Consents: undefined;
    Approval: StepParams;
    Deposit: StepParams;
    Review: StepParams;
    Complete: StepParams;
    Unwrap: StepParams;
};
type RootStackParams = { Home: undefined; Yield: undefined };
const RootStack = createNativeStackNavigator<RootStackParams>();
const FlowStack = createNativeStackNavigator<FlowStackParams>();
const onRootNavigation = mock<(navigation: NativeStackNavigationProp<RootStackParams>) => void>();
const onFlowNavigation = mock<(navigation: NativeStackNavigationProp<FlowStackParams>) => void>();

const Home = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
    useEffect(() => onRootNavigation(navigation), [navigation]);

    return <Text>Home</Text>;
};

const Step = () => {
    const navigation = useNavigation<NativeStackNavigationProp<FlowStackParams>>();
    const route = useRoute<RouteProp<FlowStackParams>>();
    const isFocused = useIsFocused();
    const close = useNavigateToInitialScreen();
    useYieldFormExitAnalytics({
        flowType: route.params?.flowType ?? 'deposit',
        networkSymbol: asNetworkSymbol('eth'),
        vaultId: 'public-vault',
        isEnabled: !!route.params && route.name !== 'Review' && route.name !== 'Complete',
        isCompleted: route.params?.isCompleted,
    });
    useEffect(() => {
        if (isFocused) onFlowNavigation(navigation);
    }, [isFocused, navigation]);

    return (
        <Pressable testID="close-flow" onPress={close}>
            <Text>{route.name}</Text>
        </Pressable>
    );
};

const Yield = () => (
    <YieldFlowExitAnalyticsProvider>
        <FlowStack.Navigator screenOptions={{ animation: 'none' }}>
            <FlowStack.Screen name="Info" component={Step} />
            <FlowStack.Screen name="Consents" component={Step} />
            <FlowStack.Screen name="Approval" component={Step} />
            <FlowStack.Screen name="Deposit" component={Step} />
            <FlowStack.Screen name="Review" component={Step} />
            <FlowStack.Screen name="Complete" component={Step} />
            <FlowStack.Screen name="Unwrap" component={Step} />
        </FlowStack.Navigator>
    </YieldFlowExitAnalyticsProvider>
);

const renderFlow = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
    const view = await renderWithStoreProvider(
        <RootStack.Navigator screenOptions={{ animation: 'none' }}>
            <RootStack.Screen name="Home" component={Home} />
            <RootStack.Screen name="Yield" component={Yield} />
        </RootStack.Navigator>,
        { services },
    );
    const root = onRootNavigation.mock.calls.at(-1)?.[0];
    if (!root) throw new Error('Missing root navigation');
    await act(() => root.navigate('Yield'));
    const flow = () => {
        const navigation = onFlowNavigation.mock.calls.at(-1)?.[0];
        if (!navigation) throw new Error('Missing flow navigation');

        return navigation;
    };

    return { ...view, analytics: services.analytics, flow };
};

describe('Yield flow cancellation with nested native stacks', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([true, false])(
        'reports one exit after internal back navigation (onboarding=%s)',
        async onboarding => {
            const view = await renderFlow();
            if (onboarding) {
                await act(() => view.flow().navigate('Consents'));
                await act(() => view.flow().navigate('Approval', { flowType: 'deposit' }));
            } else {
                await act(() => view.flow().replace('Approval', { flowType: 'deposit' }));
            }
            await act(() => view.flow().navigate('Deposit', { flowType: 'deposit' }));
            await act(() => view.flow().goBack());
            expect(view.analytics.report).not.toHaveBeenCalled();

            await fireEvent.press(view.getByTestId('close-flow'));

            expect(view.getByText('Home')).toBeTruthy();
            expect(view.analytics.report).toHaveBeenCalledTimes(1);
            expect(view.analytics.report).toHaveBeenCalledWith({
                type: 'yield/navigate',
                payload: {
                    action: 'cancel',
                    from: 'deposit-form',
                    to: 'earn-dashboard',
                    networkSymbol: 'eth',
                    vaultId: 'public-vault',
                },
            });
        },
    );

    it('retains the unfinished flow after hardware back unmounts all forms', async () => {
        const view = await renderFlow();
        await act(() => view.flow().navigate('Consents'));
        await act(() => view.flow().navigate('Approval', { flowType: 'deposit' }));
        await act(() => view.flow().goBack());
        await act(() => view.flow().goBack());
        expect(view.analytics.report).not.toHaveBeenCalled();

        await act(() => view.flow().goBack());

        expect(view.getByText('Home')).toBeTruthy();
        expect(view.analytics.report).toHaveBeenCalledTimes(1);
    });

    it('does not report a form cancellation before a form is entered', async () => {
        const view = await renderFlow();
        await fireEvent.press(view.getByTestId('close-flow'));

        expect(view.getByText('Home')).toBeTruthy();
        expect(view.analytics.report).not.toHaveBeenCalled();
    });

    it.each(['withdraw', 'redeem'] as const)(
        'reports an unfinished %s when leaving the stack',
        async flowType => {
            const view = await renderFlow();
            await act(() => view.flow().replace('Deposit', { flowType }));
            await act(() => view.flow().goBack());

            expect(view.getByText('Home')).toBeTruthy();
            expect(view.analytics.report).toHaveBeenCalledTimes(1);
            expect(view.analytics.report).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ action: 'cancel', from: 'withdraw-form' }),
                }),
            );
        },
    );

    it('does not cancel a completed deposit when close refocuses its approval form', async () => {
        const view = await renderFlow();
        await act(() => view.flow().replace('Approval', { flowType: 'deposit' }));
        await act(() => view.flow().navigate('Deposit', { flowType: 'deposit' }));
        await act(() => view.flow().setParams({ isCompleted: true }));
        await act(() =>
            view.flow().replace('Complete', { flowType: 'deposit', isCompleted: true }),
        );

        await fireEvent.press(view.getByTestId('close-flow'));

        expect(view.getByText('Home')).toBeTruthy();
        expect(view.analytics.report).not.toHaveBeenCalled();
    });

    it.each(['withdraw', 'redeem'] as const)(
        'does not cancel %s when the optional unwrap is closed',
        async flowType => {
            const view = await renderFlow();
            await act(() => view.flow().replace('Deposit', { flowType }));
            await act(() => view.flow().replace('Unwrap', { flowType, isCompleted: true }));
            await fireEvent.press(view.getByTestId('close-flow'));

            expect(view.getByText('Home')).toBeTruthy();
            expect(view.analytics.report).not.toHaveBeenCalled();
        },
    );

    it.each(['deposit', 'withdraw', 'redeem'] as const)(
        'does not cancel %s confirmed while review is focused',
        async flowType => {
            const view = await renderFlow();
            await act(() => view.flow().replace('Deposit', { flowType }));
            const formNavigation = view.flow();
            await act(() => formNavigation.navigate('Review', { flowType }));
            expect(formNavigation.isFocused()).toBe(false);

            await act(() => {
                formNavigation.setParams({ isCompleted: true });
                view.flow().replace('Complete', { flowType, isCompleted: true });
            });
            await fireEvent.press(view.getByTestId('close-flow'));

            expect(view.getByText('Home')).toBeTruthy();
            expect(view.analytics.report).not.toHaveBeenCalled();
        },
    );
});
