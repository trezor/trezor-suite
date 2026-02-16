import { ReactNode } from 'react';

import styled, { useTheme } from 'styled-components';

import {
    Column,
    Icon,
    IconName,
    IconVariant,
    Row,
    Text,
    TextProps,
    getColorForIconVariant,
    iconSizes,
} from '@trezor/components';
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

export const TooltipRow = ({
    leftItem,
    children,
    header,
    variant,
    circleIconName,
    onClick,
}: UpdateRowProps) => {
    const theme = useTheme();
    const textProps = mapIconVariantToTextProps(variant);

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
                        <Text {...textProps}>{children}</Text>
                    </Row>
                </Column>
            </Row>
        </Pointer>
    );
};
