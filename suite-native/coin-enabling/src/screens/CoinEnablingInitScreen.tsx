import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { Screen } from '@suite-native/navigation';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    applyDiscoveryChangesThunk,
    selectEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { analytics, EventType } from '@suite-native/analytics';

import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

const buttonStyle = prepareNativeStyle<{ bottomInset: number }>((utils, { bottomInset }) => ({
    bottom: bottomInset,
    left: 0,
    right: 0,
    paddingHorizontal: utils.spacings.medium,
}));

export const CoinEnablingInitScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const { applyStyle } = useNativeStyles();
    const { bottom: bottomInset } = useSafeAreaInsets();
    const enabledNetworkSymbols = useSelector(selectEnabledDiscoveryNetworkSymbols);

    const handleSave = () => {
        dispatch(setIsCoinEnablingInitFinished(true));
        if (enabledNetworkSymbols.length > 0) {
            dispatch(setIsCoinEnablingInitFinished(true));
            dispatch(applyDiscoveryChangesThunk());
            analytics.report({
                type: EventType.CoinEnablingInitState,
                payload: { enabledNetworks: enabledNetworkSymbols },
            });
            navigation.goBack();
        }
    };

    useEffect(() => {
        //prevent dismissing screen via HW
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            return true;
        });

        return () => subscription.remove();
    }, []);

    return (
        <>
            <Screen>
                <VStack paddingHorizontal="small">
                    <VStack paddingBottom="extraLarge">
                        <Text variant="titleSmall">
                            <Translation id="moduleHome.coinEnabling.title" />
                        </Text>
                        <Text color="textSubdued">
                            <Translation id="moduleHome.coinEnabling.subtitle" />
                        </Text>
                    </VStack>
                    <Box flex={1}>
                        <DiscoveryCoinsFilter
                            allowDeselectLastCoin={true}
                            allowChangeAnalytics={false}
                        />
                    </Box>
                </VStack>
            </Screen>
            <Box style={applyStyle(buttonStyle, { bottomInset })}>
                {A.isNotEmpty(enabledNetworkSymbols) && (
                    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                        <Button onPress={handleSave}>
                            <Translation id="moduleHome.coinEnabling.button" />
                        </Button>
                    </Animated.View>
                )}
            </Box>
        </>
    );
};
