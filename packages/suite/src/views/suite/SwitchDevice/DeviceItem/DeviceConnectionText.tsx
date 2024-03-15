import { Icon, IconType, Text, TextVariant } from '@trezor/components';
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
    variant: TextVariant;
    'data-test'?: string;
    icon: IconType;
    children: ReactNode;
    isAction?: boolean;
};

export const DeviceConnectionText = ({
    onClick,
    variant,
    'data-test': dataTest,
    children,
    icon,
    isAction,
}: DeviceConnectionTextProps) => (
    <Container $isAction={isAction} onClick={onClick} data-test={dataTest}>
        <TextRow>
            <Icon icon={icon} size={12} variant={variant} />
            <Text variant={variant}>{children} </Text>
        </TextRow>
    </Container>
);
