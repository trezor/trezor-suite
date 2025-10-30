import { IconName, NewButton, NewButtonProps, NewIconButton } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { ConditionalRender } from 'src/support/suite/ConditionalRender';

type HeaderActionButtonProps = Pick<
    NewButtonProps,
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
            <NewIconButton
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
            <NewButton
                iconLeft={icon}
                onClick={onClick}
                data-testid={dataTestId}
                size={size}
                isDisabled={isDisabled}
                intent={intent}
                priority={priority}
            >
                {children}
            </NewButton>
        </ConditionalRender>
    </>
);
