import { type ReactNode } from 'react';

import { Card, Column, type IconComponent, InfoItem, Tooltip } from '@trezor/components';

type SettingsSectionProps = {
    title: ReactNode;
    icon?: IconComponent;
    children?: ReactNode;
    tooltipText?: ReactNode;
    hasVerticalLayout?: boolean;
    hasContainer?: boolean;
};

export const SettingsSection = ({
    title,
    icon,
    children,
    tooltipText,
    hasVerticalLayout,
    hasContainer = true,
}: SettingsSectionProps) => {
    const width = hasVerticalLayout ? '100%' : 250;

    return (
        <InfoItem
            ellipsisLineCount={0}
            direction={hasVerticalLayout ? 'column' : 'row'}
            labelWidth={width}
            icon={icon}
            label={
                <Tooltip hasIcon content={tooltipText}>
                    {title}
                </Tooltip>
            }
            intent="neutral"
            priority="primary"
            typographyStyle="headline-sm"
            verticalAlignment="start"
        >
            {hasContainer ? (
                <Card>
                    <Column gap={32} hasDivider>
                        {children}
                    </Column>
                </Card>
            ) : (
                <Column gap={32} width="100%">
                    {children}
                </Column>
            )}
        </InfoItem>
    );
};
