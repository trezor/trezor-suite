import { type MouseEventHandler, type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import {
    Icon,
    type IconComponent,
    type IconProps,
    Row,
    Spinner,
    Text,
    type TextProps,
} from '@trezor/components';
const Container = styled.span<{ $isAction?: boolean }>`
    width: stretch;
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
    icon: IconComponent;
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
            <Row gap={4}>
                {isLoading ? (
                    <Spinner size={16} isDisabled={true} />
                ) : (
                    <Icon as={icon} size={12} {...colorProps} />
                )}
                <Text ellipsisLineCount={1} typographyStyle="body-xs" {...colorProps}>
                    {children}
                </Text>
            </Row>
        </Container>
    );
};
