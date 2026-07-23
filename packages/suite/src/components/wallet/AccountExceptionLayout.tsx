import { type ReactNode } from 'react';

import {
    Button,
    type ButtonProps,
    Card,
    Column,
    H2,
    IconCircle,
    type IconCircleIntent,
    type IconComponent,
    Paragraph,
    Row,
} from '@trezor/components';

interface AccountExceptionLayoutProps {
    title: ReactNode;
    description?: ReactNode;
    icon?: IconComponent;
    iconVariant?: IconCircleIntent;
    actions?: ({ key: string } & ButtonProps)[];
    'data-testid'?: string;
}

export const AccountExceptionLayout = (props: AccountExceptionLayoutProps) => (
    <Card data-testid={props['data-testid']}>
        <Column gap={4} alignItems="center" margin={{ bottom: 24 }}>
            {props.icon && props.iconVariant && (
                <IconCircle
                    icon={props.icon}
                    intent={props.iconVariant}
                    size={96}
                    margin={{ top: 32, bottom: 24 }}
                />
            )}
            <H2 align="center">{props.title}</H2>
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-md"
                margin={{ top: 8 }}
                align="center"
            >
                {props.description}
            </Paragraph>
            {props.actions && (
                <>
                    <Row justifyContent="center" gap={16} margin={{ top: 16 }}>
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
