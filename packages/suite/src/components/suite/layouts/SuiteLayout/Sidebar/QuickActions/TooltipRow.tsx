import styled, { useTheme } from 'styled-components';
import {
    Column,
    Row,
    Icon,
    iconSizes,
    Text,
    getColorForIconVariant,
    IconVariant,
    IconName,
} from '@trezor/components';
import { ReactNode } from 'react';
import { borders, spacings, spacingsPx } from '@trezor/theme';

type IconCircleWrapperProps = {
    $variant: IconVariant;
};

const IconCircleWrapper = styled.div<IconCircleWrapperProps>`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 14px;
    height: 14px;

    background-color: ${({ theme, $variant }) =>
        getColorForIconVariant({ theme, variant: $variant })};
    border-radius: ${borders.radii.full};
    border: 1px solid ${({ theme }) => theme['borderElevationNegative']};
    padding: ${spacingsPx.xxxs};
`;

const Pointer = styled.div`
    cursor: ${({ onClick }) => (onClick ? 'pointer' : undefined)};
`;

type UpdateRowProps = {
    children: ReactNode;
    leftItem: ReactNode;
    header: ReactNode;
    variant: IconVariant;
    circleIconName: IconName;
    onClick?: () => void;
};

export const TooltipRow = ({
    leftItem,
    children,
    header,
    variant,
    circleIconName,
    onClick,
}: UpdateRowProps) => {
    const theme = useTheme();

    return (
        <Pointer onClick={onClick}>
            <Row gap={spacings.sm} onClick={onClick}>
                {leftItem}
                <Column alignItems="start">
                    <Text>{header}</Text>
                    <Row gap={spacings.xxs}>
                        <IconCircleWrapper $variant={variant}>
                            <Icon
                                name={circleIconName}
                                color={theme.iconDefaultInverted}
                                size={iconSizes.extraSmall}
                            />
                        </IconCircleWrapper>
                        <Text variant={variant}>{children}</Text>
                    </Row>
                </Column>
            </Row>
        </Pointer>
    );
};
