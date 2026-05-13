import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
    type EntryExitAnimationFunction,
    FadeOut,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { type AddCoinFlowType, type CloseActionType, GoBackIcon } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountsSearchForm, SEARCH_INPUT_ANIMATION_DURATION } from './AccountsSearchForm';
import { AddAccountButton } from './AddAccountsButton';
import { FilterCountBadge } from './FilterCountBadge';

type SearchableAccountsListHeaderProps = {
    title: ReactNode;
    onSearchInputChange: (value: string) => void;
    searchValue?: string;
    flowType?: AddCoinFlowType;
    closeActionType?: CloseActionType;
    closeAction?: () => void;
    onFilterPress?: () => void;
    activeFilterCount?: number;
};

const HEADER_ANIMATION_DURATION = 100;

const searchFormContainerStyle = prepareNativeStyle(({ spacings }) => ({
    height: 48,
    marginBottom: spacings.sp8,
    paddingTop: spacings.sp4,
}));

export const SearchableAccountsListHeader = ({
    title,
    onSearchInputChange,
    searchValue,
    flowType,
    closeActionType,
    closeAction,
    onFilterPress,
    activeFilterCount = 0,
}: SearchableAccountsListHeaderProps) => {
    const isFirstRender = useSharedValue(true);
    const { applyStyle } = useNativeStyles();

    const [isSearchActive, setIsSearchActive] = useState(false);

    useEffect(() => {
        if (searchValue === '') {
            setIsSearchActive(false);
        }
    }, [searchValue]);

    const handleHideFilter = () => {
        setIsSearchActive(false);
        onSearchInputChange('');
    };

    const enteringFadeInAnimation: EntryExitAnimationFunction = () => {
        'worklet';

        // This fade in animation is not triggered on the first render. Triggered only on
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

    return (
        <Box style={applyStyle(searchFormContainerStyle)}>
            {isSearchActive ? (
                <AccountsSearchForm
                    onPressCancel={handleHideFilter}
                    onInputChange={onSearchInputChange}
                />
            ) : (
                <Animated.View
                    entering={enteringFadeInAnimation}
                    exiting={FadeOut.duration(HEADER_ANIMATION_DURATION)}
                >
                    <HStack alignItems="center">
                        <HStack flex={1} alignItems="center" spacing="sp8">
                            {closeActionType && (
                                <GoBackIcon
                                    closeActionType={closeActionType}
                                    closeAction={closeAction}
                                />
                            )}
                            <IconButton
                                iconName="magnifyingGlass"
                                onPress={() => setIsSearchActive(true)}
                                intent="neutral"
                                priority="secondary"
                            />
                        </HStack>
                        <Text variant="body-md-strong" numberOfLines={1} adjustsFontSizeToFit>
                            {title}
                        </Text>
                        <HStack
                            flex={1}
                            justifyContent="flex-end"
                            alignItems="center"
                            spacing="sp8"
                        >
                            {onFilterPress && (
                                <View>
                                    <IconButton
                                        iconName="funnelSimple"
                                        onPress={onFilterPress}
                                        intent="neutral"
                                        priority="secondary"
                                        testID="@myAssets/networkFilterButton"
                                    />
                                    {activeFilterCount > 0 && (
                                        <FilterCountBadge count={activeFilterCount} />
                                    )}
                                </View>
                            )}
                            {flowType && (
                                <AddAccountButton
                                    flowType={flowType}
                                    testID="@myAssets/addAccountButton"
                                />
                            )}
                        </HStack>
                    </HStack>
                </Animated.View>
            )}
        </Box>
    );
};
