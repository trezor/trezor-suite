import { type MouseEventHandler, type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import {
    Icon,
    type IconName,
    type IconProps,
    Row,
    Spinner,
    Text,
    type TextProps,
} from '@trezor/components';
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
    intent?: IconProps['intent'];
    priority?: IconProps['priority'];
    isDisabled?: IconProps['isDisabled'];
    'data-testid'?: string;
    'data-testid-alt'?: string;
    icon: IconName;
    children: ReactNode;
    isAction?: boolean;
    isLoading?: boolean;
};

export const DeviceConnectionText = ({
    onClick,
    intent = 'neutral',
    priority,
    isDisabled = false,
    'data-testid': dataTest,
    'data-testid-alt': dataTestAlt,
    children,
    icon,
    isAction,
    isLoading,
}: DeviceConnectionTextProps) => {
    const colorProps: Pick<TextProps, 'intent' | 'priority' | 'isDisabled'> = {
        intent,
        priority,
        isDisabled,
    };

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
                    <Icon name={icon} size={12} {...colorProps} />
                )}
                <Text typographyStyle="body-xs" {...colorProps}>
                    {children}
                </Text>
            </Row>
        </Container>
    );
};
