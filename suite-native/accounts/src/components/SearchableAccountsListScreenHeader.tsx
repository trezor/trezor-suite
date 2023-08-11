import React, { ReactNode, useState } from 'react';
import Animated, {
    EntryExitAnimationFunction,
    FadeOut,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { ScreenHeader } from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';

import { AccountsSearchForm, SEARCH_INPUT_ANIMATION_DURATION } from './AccountsSearchForm';

type SearchableAccountsListScreenHeaderProps = {
    title: string;
    onSearchInputChange: (value: string) => void;
    rightIcon?: ReactNode;
};

const HEADER_ANIMATION_DURATION = 100;

export const SearchableAccountsListScreenHeader = ({
    title,
    onSearchInputChange,
    rightIcon,
}: SearchableAccountsListScreenHeaderProps) => {
    const isFirstRender = useSharedValue(true);

    const [isSearchActive, setIsSearchActive] = useState(false);

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

    return isSearchActive ? (
        <AccountsSearchForm onPressCancel={handleHideFilter} onInputChange={onSearchInputChange} />
    ) : (
        <Animated.View
            entering={enteringFadeInAnimation}
            exiting={FadeOut.duration(HEADER_ANIMATION_DURATION)}
        >
            <ScreenHeader
                content={title}
                leftIcon={
                    <IconButton
                        iconName="search"
                        onPress={() => setIsSearchActive(true)}
                        colorScheme="tertiaryElevation0"
                        size="medium"
                    />
                }
                rightIcon={rightIcon}
            />
        </Animated.View>
    );
};
