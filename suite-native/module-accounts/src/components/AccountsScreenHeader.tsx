import React, { useState } from 'react';
import Animated, {
    EntryExitAnimationFunction,
    FadeOut,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    AccountsSearchForm,
    SEARCH_FORM_HEIGHT,
    SEARCH_INPUT_ANIMATION_DURATION,
} from './AccountsSearchForm';

type AccountsScreenHeaderProps = {
    onSearchInputChange: (value: string) => void;
};

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

const headerContainerStyle = prepareNativeStyle(() => ({
    // The height of this container has to be same as the height of the AccountsSearchForm to prevent
    // the AccountsList from jumping when the header content is switched to the search form and vice versa.
    height: SEARCH_FORM_HEIGHT,
}));

const HEADER_ANIMATION_DURATION = 100;

export const AccountsScreenHeader = ({ onSearchInputChange }: AccountsScreenHeaderProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { applyStyle } = useNativeStyles();
    const isFirstRender = useSharedValue(true);

    const [isSearchActive, setIsSearchActive] = useState(false);

    const handleImportAsset = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleHideFilter = () => {
        setIsSearchActive(false);
        onSearchInputChange('');
    };

    const enteringFadeInAnimation: EntryExitAnimationFunction = () => {
        'worklet';

        // This fade in animation is not triggered on the first render of AccountsScreenHeader. Triggered only on
        // subsequent renders while the user is switching between the header and AccountsSearchForm.
        const initialValues = {
            opacity: isFirstRender.value ? 1 : 0,
        };
        isFirstRender.value = false;

        return {
            initialValues,
            animations: {
                opacity: withDelay(
                    // Delayed to start right after the AccountsSearchForm exit animation finishes.
                    SEARCH_INPUT_ANIMATION_DURATION,
                    withTiming(1, { duration: HEADER_ANIMATION_DURATION }),
                ),
            },
        };
    };

    return isSearchActive ? (
        <AccountsSearchForm onPressCancel={handleHideFilter} onInputChange={onSearchInputChange} />
    ) : (
        <Animated.View
            entering={enteringFadeInAnimation}
            exiting={FadeOut.duration(HEADER_ANIMATION_DURATION)}
            style={applyStyle(headerContainerStyle)}
        >
            <ScreenHeader
                content="My assets"
                leftIcon={
                    <IconButton
                        iconName="search"
                        onPress={() => setIsSearchActive(true)}
                        colorScheme="tertiaryElevation0"
                        size="medium"
                    />
                }
                rightIcon={
                    <IconButton
                        iconName="plus"
                        onPress={handleImportAsset}
                        colorScheme="tertiaryElevation0"
                        size="medium"
                    />
                }
            />
        </Animated.View>
    );
};
