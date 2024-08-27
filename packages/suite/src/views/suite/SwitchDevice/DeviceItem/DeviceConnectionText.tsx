import { IconLegacy, IconLegacyType, IconVariant, Text } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import styled, { css } from 'styled-components';
import { ReactNode } from 'react';

const Container = styled.span<{ $isAction?: boolean }>`
    ${typography.label}

    ${({ $isAction }) =>
        $isAction &&
        css`
            &:hover {
                opacity: 0.8;
            }
        `}
`;
const TextRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

type DeviceConnectionTextProps = {
    onClick?: () => void;
    variant: IconVariant;
    'data-testid'?: string;
    icon: IconLegacyType;
    children: ReactNode;
    isAction?: boolean;
};

export const DeviceConnectionText = ({
    onClick,
    variant,
    'data-testid': dataTest,
    children,
    icon,
    isAction,
}: DeviceConnectionTextProps) => (
    <Container $isAction={isAction} onClick={onClick} data-testid={dataTest}>
        <TextRow>
            <IconLegacy icon={icon} size={12} variant={variant} />
            <Text variant={variant}>{children} </Text>
        </TextRow>
    </Container>
);
