import type { ReactNode } from 'react';

import {
    ComponentWithSubIcon,
    type ComponentWithSubIconIntent,
    Icon,
    type IconComponent,
    type ManagedTooltipProps,
    Row,
    Tooltip,
} from '@trezor/components';

type QuickActionButtonProps = {
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
            <Row data-testid={dataTest} onClick={onClick} justifyContent="center">
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
            </Row>
        </Tooltip>
    );
};
