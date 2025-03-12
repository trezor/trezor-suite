import { Button, ButtonProps, IconButton, IconButtonProps } from '@trezor/components';
import { breakpointThresholds } from '@trezor/styles';

import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

export const HeaderActionButton = ({
    icon,
    onClick,
    'data-testid': dataTestId,
    variant,
    size,
    isDisabled,
    children,
}: Pick<ButtonProps, 'onClick' | 'data-testid' | 'variant' | 'size' | 'isDisabled' | 'children'> &
    Pick<IconButtonProps, 'icon'>) => {
    const { contentWidth } = useResponsiveContext();
    const isContentAreaSmall = contentWidth ? contentWidth < breakpointThresholds.sm : false;
    const commonProps = { icon, onClick, 'data-testid': dataTestId, variant, size, isDisabled };

    return isContentAreaSmall ? (
        <IconButton {...commonProps} />
    ) : (
        <Button {...commonProps}>{children}</Button>
    );
};
