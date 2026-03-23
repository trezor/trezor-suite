import { Button, type ButtonProps, IconButton, type IconName } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { ConditionalRender } from 'src/support/suite/ConditionalRender';

type HeaderActionButtonProps = Pick<
    ButtonProps,
    'onClick' | 'data-testid' | 'size' | 'isDisabled' | 'children' | 'intent' | 'priority'
> & {
    icon: IconName;
};

export const HeaderActionButton = ({
    icon,
    onClick,
    'data-testid': dataTestId,
    size,
    intent,
    priority,
    isDisabled,
    children,
}: HeaderActionButtonProps) => (
    <>
        <ConditionalRender container="content" maxWidth={breakpoints.mobile}>
            <IconButton
                icon={icon}
                onClick={onClick}
                data-testid={dataTestId}
                intent={intent}
                size={size}
                isDisabled={isDisabled}
                priority={priority}
            />
        </ConditionalRender>
        <ConditionalRender container="content" minWidth={breakpoints.mobile}>
            <Button
                iconLeft={icon}
                onClick={onClick}
                data-testid={dataTestId}
                size={size}
                isDisabled={isDisabled}
                intent={intent}
                priority={priority}
            >
                {children}
            </Button>
        </ConditionalRender>
    </>
);
