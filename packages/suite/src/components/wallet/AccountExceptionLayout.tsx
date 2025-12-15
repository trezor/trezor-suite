import type { ReactNode } from 'react';
import React from 'react';

import type { ButtonProps, IconCircleVariant, IconName } from '@trezor/components';
import { Button, Card, Column, Divider, H2, IconCircle, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface AccountExceptionLayoutProps {
    title: ReactNode;
    description?: ReactNode;
    iconName?: IconName;
    iconVariant?: IconCircleVariant;
    actions?: ({ key: string } & ButtonProps)[];
    'data-testid'?: string;
}

export const AccountExceptionLayout = (props: AccountExceptionLayoutProps) => (
    <Card data-testid={props['data-testid']}>
        <Column alignItems="center" margin={{ bottom: 24 }}>
            {props.iconName && props.iconVariant && (
                <IconCircle
                    name={props.iconName}
                    variant={props.iconVariant}
                    size={90}
                    margin={{ top: spacings.xxl, bottom: spacings.xl }}
                />
            )}
            <H2>{props.title}</H2>
            <Paragraph variant="tertiary" typographyStyle="hint" margin={{ top: spacings.xs }}>
                {props.description}
            </Paragraph>
            {props.actions && (
                <>
                    <Divider margin={{ top: spacings.xxl, bottom: spacings.xxl }} />
                    <Row justifyContent="center" gap={spacings.md} margin={{ bottom: spacings.md }}>
                        {props.actions?.map(action => (
                            <Button size="large" minWidth={160} {...action} key={action.key} />
                        ))}
                    </Row>
                </>
            )}
        </Column>
    </Card>
);
