import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

type BannerResponsiveValues<T> = {
    default: T;
    desktop?: T;
    laptop?: T;
    tablet?: T;
};

export const useBannerResponsiveValue = () => {
    const isBelowDesktop = useIsContentBelowBreakpoint(breakpoints.desktop);
    const isBelowLaptop = useIsContentBelowBreakpoint(breakpoints.laptop);
    const isBelowTablet = useIsContentBelowBreakpoint(breakpoints.tablet);

    return <T>({
        default: defaultValue,
        desktop,
        laptop,
        tablet,
    }: BannerResponsiveValues<T>): T => {
        if (isBelowTablet) {
            return tablet ?? defaultValue;
        }

        if (isBelowLaptop) {
            return laptop ?? defaultValue;
        }

        if (isBelowDesktop) {
            return desktop ?? defaultValue;
        }

        return defaultValue;
    };
};
