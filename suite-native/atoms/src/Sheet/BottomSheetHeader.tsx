import { type ReactNode } from 'react';
import { View } from 'react-native';

import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { IconButton } from '../Button/IconButton';
import { Text } from '../Text';
import { BottomSheetGrabber } from './BottomSheetGrabber';
import { Box } from '../Box';

type BottomSheetHeaderProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    isCloseDisplayed: boolean;
    onCloseSheet: () => void;
    scrollDivider?: ReactNode;
};

const sheetHeaderStyle = prepareNativeStyle<{ isCloseDisplayed: boolean }>(
    (utils, { isCloseDisplayed }) => ({
        flexDirection: isCloseDisplayed ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: isCloseDisplayed ? 'center' : 'flex-start',
        paddingHorizontal: utils.spacings.sp16,
        paddingBottom: utils.spacings.sp16,
    }),
);

const titlesContainer = prepareNativeStyle<{ isCloseDisplayed: boolean }>(
    (_, { isCloseDisplayed }) => ({
        maxWidth: isCloseDisplayed ? '70%' : '100%',
    }),
);

export const BottomSheetHeader = ({
    title,
    subtitle,
    isCloseDisplayed,
    onCloseSheet,
    scrollDivider,
}: BottomSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const isHeaderDisplayed = !!(title || subtitle || isCloseDisplayed);

    return (
        <Box>
            <Box marginTop="sp8" marginBottom="sp24">
                <BottomSheetGrabber />
            </Box>
            {isHeaderDisplayed && (
                <View style={applyStyle(sheetHeaderStyle, { isCloseDisplayed })}>
                    <View style={applyStyle(titlesContainer, { isCloseDisplayed })}>
                        {title && <Text variant="headline-sm">{title}</Text>}
                        {subtitle && (
                            <Text variant="body-sm" color="textSubdued">
                                {subtitle}
                            </Text>
                        )}
                    </View>
                    {isCloseDisplayed && (
                        <IconButton
                            iconName="x"
                            onPress={onCloseSheet}
                            intent="neutral"
                            priority="secondary"
                            size="medium"
                            accessibilityRole="button"
                            accessibilityLabel={translate('generic.buttons.close')}
                            testID="@bottom-sheet/header/close-button"
                        />
                    )}
                </View>
            )}
            {scrollDivider}
        </Box>
    );
};
