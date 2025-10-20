import { ReactNode } from 'react';

import { RequireAllOrNone } from 'type-fest';

import { HStack, IconButton, Text } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';

export type SheetHeaderTitleProps = {
    children: ReactNode;
} & RequireAllOrNone<{
    onRightButtonPress: () => void;
    rightButtonIcon: IconName;
    rightButtonA11yLabel: string;
}>;

const SHEET_HEADER_TITLE_TEST_ID = '@trading/sheet-header-title';

export const SheetHeaderTitle = ({
    onRightButtonPress,
    rightButtonIcon,
    rightButtonA11yLabel,
    children,
}: SheetHeaderTitleProps) => (
    <HStack alignItems="center" justifyContent="space-between" testID={SHEET_HEADER_TITLE_TEST_ID}>
        <Text variant="titleSmall" ellipsizeMode="tail" numberOfLines={1}>
            {children}
        </Text>
        {rightButtonIcon && (
            <IconButton
                iconName={rightButtonIcon}
                onPress={onRightButtonPress}
                colorScheme="tertiaryElevation0"
                size="medium"
                accessibilityRole="button"
                accessibilityLabel={rightButtonA11yLabel}
            />
        )}
    </HStack>
);
