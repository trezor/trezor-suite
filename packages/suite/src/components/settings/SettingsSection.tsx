import React, { ReactNode } from 'react';

import {
    Box,
    Card,
    Column,
    Icon,
    IconName,
    InfoItem,
    Tooltip,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

type SettingsSectionProps = {
    title: ReactNode;
    icon?: IconName;
    className?: string;
    children?: ReactNode;
    tooltipText?: ReactNode;
};

export const SettingsSection = ({ title, icon, children, tooltipText }: SettingsSectionProps) => {
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);
    const width = isBelowLaptop ? '100%' : 250;

    return (
        <InfoItem
            ellipsisLineCount={0}
            direction={isBelowLaptop ? 'column' : 'row'}
            labelWidth={width}
            iconName={icon}
            label={
                <>
                    {title}
                    {tooltipText && (
                        <Box
                            as="span"
                            position={{
                                type: 'relative',
                                top: 2,
                                left: 5,
                            }}
                        >
                            <Tooltip isInline content={tooltipText}>
                                <Icon name="question" size="medium" />
                            </Tooltip>
                        </Box>
                    )}
                </>
            }
            variant="default"
            typographyStyle="titleSmall"
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
