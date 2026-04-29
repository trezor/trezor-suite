import { type ReactNode } from 'react';

import {
    Button,
    type ButtonProps,
    Card,
    Column,
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
        <Column gap={4} alignItems="center" margin={{ bottom: 24 }}>
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
                align="center"
            >
                {props.description}
            </Paragraph>
            {props.actions && (
                <>
                    <Row justifyContent="center" gap={spacings.md} margin={{ top: 16 }}>
                        {props.actions?.map(action => (
                            <Button
                                size="large"
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
