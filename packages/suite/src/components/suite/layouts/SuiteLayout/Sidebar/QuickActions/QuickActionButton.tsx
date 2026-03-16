import React from 'react';

import {
    ComponentWithSubIcon,
    type ComponentWithSubIconIntent,
    Icon,
    type IconName,
    type ManagedTooltipProps,
    Row,
    Tooltip,
} from '@trezor/components';

type ActionButtonProps = {
    onClick?: () => void;
    subIconIntent?: ComponentWithSubIconIntent;
    subIconName?: IconName;
    tooltip?: Partial<ManagedTooltipProps>;
    'data-testid'?: string;
    isOpen?: boolean;
} & (
    | { iconComponent: React.ReactNode; iconName?: undefined }
    | {
          iconComponent?: undefined;
          iconName: IconName;
      }
);

export const QuickActionButton = ({
    onClick,
    tooltip,
    'data-testid': dataTest,
    isOpen,
    iconComponent,
    iconName,
    subIconIntent,
    subIconName,
}: ActionButtonProps) => {
    const icon = iconName ? (
        <Icon name={iconName} size={16} intent="neutral" priority="secondary" />
    ) : (
        iconComponent
    );

    return (
        <Tooltip content={tooltip?.content} cursor="pointer" {...tooltip} isOpen={isOpen}>
            <Row data-testid={dataTest} onClick={onClick} justifyContent="center">
                {subIconName ? (
                    <ComponentWithSubIcon
                        intent={subIconIntent}
                        iconName={subIconName}
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
