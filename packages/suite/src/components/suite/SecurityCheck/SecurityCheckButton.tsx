import { Button, type ButtonProps } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

type SecurityCheckButtonProps = Omit<ButtonProps, 'minWidth' | 'maxWidth' | 'size' | 'width'>;

export const SecurityCheckButton = ({ ...props }: SecurityCheckButtonProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    return (
        <Button
            {...props}
            size="large"
            flex="1"
            maxWidth={isContentBelowBreakpoint ? undefined : 'fit-content'}
            minWidth={isContentBelowBreakpoint ? undefined : 180}
            width={isContentBelowBreakpoint ? '100%' : undefined}
        />
    );
};
