import React, { type ReactNode } from 'react';

import {
    Button,
    type ButtonProps,
    Card,
    Column,
    Divider,
    H2,
    IconCircle,
    type IconCircleIntent,
    type IconName,
    Paragraph,
    Row,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

interface AccountExceptionLayoutProps {
    title: ReactNode;
    description?: ReactNode;
    iconName?: IconName;
    iconVariant?: IconCircleIntent;
    actions?: ({ key: string } & ButtonProps)[];
    'data-testid'?: string;
}

export const AccountExceptionLayout = (props: AccountExceptionLayoutProps) => (
    <Card data-testid={props['data-testid']}>
        <Column alignItems="center" margin={{ bottom: 24 }}>
            {props.iconName && props.iconVariant && (
                <IconCircle
                    name={props.iconName}
                    intent={props.iconVariant}
                    size={96}
                    margin={{ top: spacings.xxl, bottom: spacings.xl }}
                />
            )}
            <H2>{props.title}</H2>
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                margin={{ top: spacings.xs }}
            >
                {props.description}
            </Paragraph>
            {props.actions && (
                <>
                    <Divider margin={{ top: spacings.xxl, bottom: spacings.xxl }} />
                    <Row justifyContent="center" gap={spacings.md} margin={{ bottom: spacings.md }}>
                        {props.actions?.map(action => (
                            <Button
                                size="large"
                                minWidth={160}
                                {...action}
                                key={action.key}
                                data-testid={action['data-testid']}
                            />
                        ))}
                    </Row>
                </>
            )}
        </Column>
    </Card>
);
