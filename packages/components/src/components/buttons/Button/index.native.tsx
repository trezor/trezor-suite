import React from 'react';
import styled, { css } from 'styled-components/native';
import { getPrimaryColor, getSecondaryColor } from '../../../utils/colors';
import colors from '../../../config/colors';
import { Omit, FeedbackType, IconShape } from '../../../support/types';
import Icon from '../../Icon';
import { FONT_SIZE_NATIVE } from '../../../config/variables';

const Spinner = styled.ActivityIndicator`
    padding-right: 10px;
`;

const Wrapper = styled.View`
    flex: 1;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`;

interface LabelProps extends Omit<Props, 'onClick'> {
    disabled: boolean;
}
const Label = styled.Text<LabelProps>`
    font-weight: 400;
    align-self: center;
    color: ${colors.WHITE};
    font-size: ${FONT_SIZE_NATIVE.BASE};

    ${(props: any) =>
        props.isInverse &&
        css`
            color: ${getPrimaryColor(props.variant)};
        `}

    ${(props: any) =>
        props.disabled &&
        css`
            color: ${colors.TEXT_SECONDARY};
        `}

    ${(props: any) =>
        props.isWhite &&
        css`
            color: ${colors.TEXT_SECONDARY};
        `}

    ${(props: any) =>
        props.isTransparent &&
        css`
            color: ${colors.TEXT_SECONDARY};
        `}
`;

type ButtonContainerProps = Omit<Props, 'children' | 'onClick'>;

const ButtonContainer = styled.TouchableHighlight<ButtonContainerProps>`
    padding: 10px 18px;
    border-radius: 3px;
    background-color: ${(props: any) => getPrimaryColor(props.variant)};
    border: 1px solid ${(props: any) => getPrimaryColor(props.variant)};

    ${(props: any) =>
        props.isInverse &&
        css`
            background: transparent;
            border: 1px solid ${getPrimaryColor(props.variant)};
        `}

    ${(props: any) =>
        props.disabled &&
        css`
            background-color: ${colors.GRAY_LIGHT};
            border: 1px solid ${colors.DIVIDER};
        `}

    ${(props: any) =>
        props.isWhite &&
        css`
            background: ${colors.WHITE};
            border-color: ${colors.DIVIDER};
        `}
    
    ${(props: any) =>
        props.isTransparent &&
        css`
            background: transparent;
            border: none;
        `}
`;

const IconWrapper = styled.View`
    height: ${FONT_SIZE_NATIVE.BASE};
    margin-right: 12;
`;

interface Props {
    isDisabled?: boolean;
    isInverse?: boolean;
    isWhite?: boolean;
    isTransparent?: boolean;
    isLoading?: boolean;
    children?: React.ReactNode;
    variant?: FeedbackType;
    onClick: () => void;
    icon?: string | IconShape;
}

const Button = ({
    children,
    onClick,
    variant = 'success',
    isDisabled = false,
    isWhite = false,
    isTransparent = false,
    isInverse = false,
    isLoading = false,
    icon,
    ...rest
}: Props) => {
    const iconColor =
        isDisabled || isTransparent || isWhite
            ? colors.TEXT_SECONDARY
            : isInverse
            ? getPrimaryColor(variant) || colors.WHITE
            : colors.WHITE;

    return (
        <ButtonContainer
            onPress={onClick}
            isWhite={isWhite}
            isTransparent={isTransparent}
            isInverse={isInverse}
            isLoading={isLoading}
            variant={variant}
            underlayColor={
                isDisabled || isTransparent || isWhite
                    ? colors.DIVIDER
                    : getSecondaryColor(variant) || colors.GREEN_TERTIARY
            }
            activeOpacity={0.5}
            disabled={isDisabled}
            icon={icon}
            {...rest}
        >
            <Wrapper>
                {isLoading && <Spinner size="small" color={iconColor} />}

                {!isLoading && icon && (
                    <IconWrapper>
                        <Icon icon={icon} size={14} color={iconColor} />
                    </IconWrapper>
                )}

                <Label
                    disabled={isDisabled}
                    isInverse={isInverse}
                    isWhite={isWhite}
                    isTransparent={isTransparent}
                    variant={variant}
                >
                    {children}
                </Label>
            </Wrapper>
        </ButtonContainer>
    );
};

export default Button;
