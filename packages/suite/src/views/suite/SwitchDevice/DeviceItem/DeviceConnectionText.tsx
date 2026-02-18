import { MouseEventHandler, ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Icon, IconName, IconVariant, Row, Spinner, Text, TextProps } from '@trezor/components';
import { spacings } from '@trezor/theme';

const Container = styled.span<{ $isAction?: boolean }>`
    ${({ $isAction }) =>
        $isAction &&
        css`
            &:hover {
                opacity: 0.8;
            }
        `}
`;

type DeviceConnectionTextProps = {
    onClick?: MouseEventHandler;
    variant: IconVariant;
    'data-testid'?: string;
    'data-testid-alt'?: string;
    icon: IconName;
    children: ReactNode;
    isAction?: boolean;
    isLoading?: boolean;
};

const mapIconVariantToTextProps = (
    variant: IconVariant,
): Pick<TextProps, 'intent' | 'priority' | 'isDisabled'> => {
    switch (variant) {
        case 'default':
            return { intent: 'neutral' };
        case 'tertiary':
            return { intent: 'neutral', priority: 'secondary' };
        case 'primary':
            return { intent: 'brand' };
        case 'info':
            return { intent: 'info' };
        case 'warning':
            return { intent: 'warning' };
        case 'destructive':
            return { intent: 'critical' };
        case 'disabled':
            return { intent: 'neutral', isDisabled: true };
        case 'purple':
            return { intent: 'accentViolet' };
        default:
            return { intent: 'neutral' };
    }
};

export const DeviceConnectionText = ({
    onClick,
    variant,
    'data-testid': dataTest,
    'data-testid-alt': dataTestAlt,
    children,
    icon,
    isAction,
    isLoading,
}: DeviceConnectionTextProps) => {
    const textProps = mapIconVariantToTextProps(variant);

    return (
        <Container
            $isAction={isAction}
            onClick={onClick}
            data-testid={dataTest}
            data-testid-alt={dataTestAlt}
        >
            <Row gap={spacings.xxs}>
                {isLoading ? (
                    <Spinner size={16} isDisabled={true} />
                ) : (
                    <Icon name={icon} size={12} variant={variant} />
                )}
                <Text typographyStyle="body-xs" {...textProps}>
                    {children}
                </Text>
            </Row>
        </Container>
    );
};
