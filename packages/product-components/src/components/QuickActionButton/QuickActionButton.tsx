import type { ReactNode } from 'react';

import {
    Box,
    ComponentWithSubIcon,
    type ComponentWithSubIconIntent,
    Icon,
    type IconComponent,
    type ManagedTooltipProps,
    Tooltip,
} from '@trezor/components';

type QuickActionButtonProps = {
    'aria-label': string;
    onClick?: () => unknown;
    subIconIntent?: ComponentWithSubIconIntent;
    subIcon?: IconComponent;
    tooltip?: Partial<ManagedTooltipProps>;
    'data-testid'?: string;
    isOpen?: boolean;
} & (
    | { iconComponent: ReactNode; icon?: undefined }
    | { iconComponent?: undefined; icon: IconComponent }
);

export const QuickActionButton = ({
    onClick,
    tooltip,
    'data-testid': dataTest,
    'aria-label': ariaLabel,
    isOpen,
    iconComponent,
    icon: IconComponent,
    subIconIntent,
    subIcon,
}: QuickActionButtonProps) => {
    const icon = IconComponent ? (
        <Icon as={IconComponent} size={16} intent="neutral" priority="secondary" />
    ) : (
        iconComponent
    );

    return (
        <Tooltip content={tooltip?.content} cursor="pointer" {...tooltip} isOpen={isOpen}>
            <Box
                as="button"
                aria-label={ariaLabel}
                data-testid={dataTest}
                onClick={onClick}
                padding={10}
                type="button"
                cursor="pointer"
            >
                {subIcon ? (
                    <ComponentWithSubIcon
                        intent={subIconIntent}
                        icon={subIcon}
                        iconSize={8}
                        iconOffset={8}
                    >
                        {icon}
                    </ComponentWithSubIcon>
                ) : (
                    icon
                )}
            </Box>
        </Tooltip>
    );
};
