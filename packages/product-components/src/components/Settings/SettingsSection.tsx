import { type ReactNode } from 'react';

import { Card, Column, type IconName, InfoItem, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

type SettingsSectionProps = {
    title: ReactNode;
    icon?: IconName;
    className?: string;
    children?: ReactNode;
    tooltipText?: ReactNode;
    isBelowLaptop?: boolean;
};

export const SettingsSection = ({
    title,
    icon,
    children,
    tooltipText,
    isBelowLaptop,
}: SettingsSectionProps) => {
    const width = isBelowLaptop ? '100%' : 250;

    return (
        <InfoItem
            ellipsisLineCount={0}
            direction={isBelowLaptop ? 'column' : 'row'}
            labelWidth={width}
            iconName={icon}
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
            <Card>
                <Column gap={spacings.xxl} hasDivider>
                    {children}
                </Column>
            </Card>
        </InfoItem>
    );
};
