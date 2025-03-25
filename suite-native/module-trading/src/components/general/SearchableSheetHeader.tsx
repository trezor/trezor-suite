import { ReactNode, useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { BottomSheetGrabber, VStack } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SearchInputWithCancel } from './SearchInputWithCancel';
import { SheetHeaderTitle } from './SheetHeaderTitle';

export type SearchableSheetHeaderProps = {
    onClose: () => void;
    title: ReactNode;
    leftButtonIcon?: IconName;
    leftButtonA11yLabel?: string;
    onFilterFocusChange?: (isFilterActive: boolean) => void;
    children?: ReactNode;
    style?: NativeStyleObject;
    onFilterChange?: (value: string) => void;
    filterValue?: string;
};

export const FOCUS_ANIMATION_DURATION = 300 as const;

const noOp = () => {};

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp16,
    gap: spacings.sp16,
}));

export const SearchableSheetHeader = ({
    onClose,
    title,
    children,
    onFilterFocusChange = noOp,
    style,
    leftButtonIcon = 'x',
    leftButtonA11yLabel,
    onFilterChange = noOp,
    filterValue,
}: SearchableSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const [isFilterActive, setIsFilterActive] = useState(false);

    const changeFilterFocus = useCallback(
        (newValue: boolean) => {
            setIsFilterActive(newValue);
            onFilterFocusChange(newValue);
        },
        [onFilterFocusChange],
    );

    return (
        <VStack style={[applyStyle(wrapperStyle), style]}>
            <BottomSheetGrabber />
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                {!isFilterActive && (
                    <Animated.View
                        entering={FadeIn.duration(FOCUS_ANIMATION_DURATION)}
                        exiting={FadeOut.duration(FOCUS_ANIMATION_DURATION)}
                    >
                        <SheetHeaderTitle
                            leftButtonIcon={leftButtonIcon}
                            onLeftButtonPress={onClose}
                            leftButtonA11yLabel={
                                leftButtonA11yLabel ?? translate('generic.buttons.close')
                            }
                        >
                            {title}
                        </SheetHeaderTitle>
                    </Animated.View>
                )}
            </Animated.View>
            <Animated.View layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}>
                <SearchInputWithCancel
                    onChange={onFilterChange}
                    onFocus={() => changeFilterFocus(true)}
                    onBlur={() => changeFilterFocus(false)}
                    value={filterValue}
                />
            </Animated.View>
            {children}
        </VStack>
    );
};
