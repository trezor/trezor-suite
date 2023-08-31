import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { Assets } from '@suite-native/assets';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { PortfolioGraph } from '../components/PortfolioGraph';
import { DashboardNavigationButtons } from '../components/DashboardNavigationButtons';

const HOME_SCREEN_MARGIN_TOP = 88;

const homeScreenContentStyle = prepareNativeStyle(_ => ({
    marginTop: HOME_SCREEN_MARGIN_TOP,
}));

export const HomeScreen = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Screen>
            <VStack spacing="large" style={applyStyle(homeScreenContentStyle)}>
                <PortfolioGraph />
                <Assets />
                <DashboardNavigationButtons />
            </VStack>
        </Screen>
    );
};
