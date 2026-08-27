import { type ReactNode } from 'react';
import { type ViewProps } from 'react-native';
import { type AnimatedProps } from 'react-native-reanimated';

import { type NativeSpacing } from '@trezor/theme';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, type ScreenHeaderProps } from '../ScreenHeader';

export type DynamicScreenHeaderProps = {
    subtitleVariant?: 'body-sm' | 'body-md';
    subtitle?: ReactNode;
    isCompactOnly?: boolean;
    marginBottom?: NativeSpacing;
    marginTop?: NativeSpacing;
    compactContent?: ReactNode;
    expandedContent?: ReactNode;
    scrollThreshold?: number;
    contentEnteringAnimation?: AnimatedProps<ViewProps>['entering'];
    contentLayoutAnimation?: AnimatedProps<ViewProps>['layout'];
} & ScreenHeaderProps;

export const DynamicScreenHeader = ({
    title,
    isCompactOnly = false,
    compactContent,
    ...screenHeaderProps
}: DynamicScreenHeaderProps) => {
    const { isScrollableHeaderScrolled } = useDynamicHeader();

    const shouldRenderScreenHeaderContent = isScrollableHeaderScrolled || isCompactOnly;

    return (
        <ScreenHeader
            {...screenHeaderProps}
            title={shouldRenderScreenHeaderContent && !compactContent ? title : undefined}
            customContent={shouldRenderScreenHeaderContent ? compactContent : undefined}
        />
    );
};
