import {
    IconButton,
    IconButtonProps,
    IconName,
    NewButton,
    NewButtonProps,
} from '@trezor/components';
import { NewButtonIntent } from '@trezor/components/src/components/buttons/NewButton/types';
import { breakpoints } from '@trezor/theme';

import { ConditionalRender } from 'src/support/suite/ConditionalRender';

type HeaderActionButtonProps = Pick<
    NewButtonProps,
    'onClick' | 'data-testid' | 'size' | 'isDisabled' | 'children' | 'intent' | 'priority'
> & {
    icon: IconName;
};

const mapIntentToIconVariant = (
    intent: NewButtonIntent | undefined,
): IconButtonProps['variant'] => {
    switch (intent) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'critical':
            return 'destructive';
        case 'neutral':
            return 'tertiary';
        case 'brand':
        default:
            return 'primary';
    }
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
}: HeaderActionButtonProps) => {
    const iconButtonVariant = mapIntentToIconVariant(intent);
    const isIconSubtle = priority === 'secondary';

    return (
        <>
            <ConditionalRender container="content" maxWidth={breakpoints.mobile}>
                <IconButton
                    icon={icon}
                    onClick={onClick}
                    data-testid={dataTestId}
                    variant={iconButtonVariant}
                    size={size}
                    isDisabled={isDisabled}
                    isSubtle={isIconSubtle}
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
};
