import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Icon, IconName, IconVariant, Row, Text } from '@trezor/components';
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
    onClick?: () => void;
    variant: IconVariant;
    'data-testid'?: string;
    'data-testid-alt'?: string;
    icon: IconName;
    children: ReactNode;
    isAction?: boolean;
};

export const DeviceConnectionText = ({
    onClick,
    variant,
    'data-testid': dataTest,
    'data-testid-alt': dataTestAlt,
    children,
    icon,
    isAction,
}: DeviceConnectionTextProps) => (
    <Container
        $isAction={isAction}
        onClick={onClick}
        data-testid={dataTest}
        data-testid-alt={dataTestAlt}
    >
        <Row gap={spacings.xxs}>
            <Icon name={icon} size={12} variant={variant} />
            <Text typographyStyle="label" variant={variant}>
                {children}
            </Text>
        </Row>
    </Container>
);
