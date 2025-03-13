import { Button, ButtonProps, IconButton, IconButtonProps } from '@trezor/components';
import { breakpointThresholds } from '@trezor/styles';

import { ConditionalRender } from 'src/support/suite/ConditionalRender';

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
    const commonProps = { icon, onClick, 'data-testid': dataTestId, variant, size, isDisabled };

    return (
        <>
            <ConditionalRender container="content" maxWidth={breakpointThresholds.sm}>
                <IconButton {...commonProps} />
            </ConditionalRender>
            <ConditionalRender container="content" minWidth={breakpointThresholds.sm}>
                <Button {...commonProps}>{children}</Button>
            </ConditionalRender>
        </>
    );
};
