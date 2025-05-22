import { Button, ButtonProps, IconButton, IconButtonProps } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

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
            <ConditionalRender container="content" maxWidth={breakpoints.mobile}>
                <IconButton {...commonProps} />
            </ConditionalRender>
            <ConditionalRender container="content" minWidth={breakpoints.mobile}>
                <Button {...commonProps} textWrap={false}>
                    {children}
                </Button>
            </ConditionalRender>
        </>
    );
};
