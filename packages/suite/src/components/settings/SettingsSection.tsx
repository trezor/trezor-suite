import React, { ReactNode } from 'react';

import { IconName, Card, Column, useMediaQuery, variables, InfoItem } from '@trezor/components';
import { spacings } from '@trezor/theme';

type SettingsSectionProps = {
    title: ReactNode;
    icon?: IconName;
    className?: string;
    children?: ReactNode;
};

export const SettingsSection = ({ title, icon, children }: SettingsSectionProps) => {
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);

    return (
        <InfoItem
            direction={isBelowLaptop ? 'column' : 'row'}
            labelWidth={250}
            iconName={icon}
            label={title}
            variant="default"
            typographyStyle="titleSmall"
            verticalAlignment="top"
        >
            <Card>
                <Column gap={spacings.xxl} hasDivider>
                    {children}
                </Column>
            </Card>
        </InfoItem>
    );
};
