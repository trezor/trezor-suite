import { Column, type FlexProps, Row } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useResponsiveContext } from './ResponsiveContext';

const DEFAULT_BREAKPOINT = breakpoints.mobile;

export const useIsContentBelowBreakpoint = (breakpoint: number = DEFAULT_BREAKPOINT) => {
    const { contentWidth } = useResponsiveContext();

    return !!(contentWidth && contentWidth < breakpoint);
};

type ContentFlexProps = FlexProps & {
    breakpoint?: number;
};

export const ContentFlex = ({ breakpoint = DEFAULT_BREAKPOINT, ...rest }: ContentFlexProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoint);
    const Component = isContentBelowBreakpoint ? Column : Row;

    return <Component {...rest} direction="row" />;
};
