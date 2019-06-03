import React from 'react';
import styled, { css } from 'styled-components/native';
import { getPrimaryColor, getSecondaryColor } from '../../../utils/colors';
import colors from '../../../config/colors';
import { Omit, FeedbackType } from '../../../support/types';

const Spinner = styled.ActivityIndicator`
    padding-right: 10px;
`;

const View = styled.View`
    flex-direction: row;
`;

interface LabelProps {
    disabled: boolean;
}
const Label = styled.Text<LabelProps>`
    font-weight: 400;
    align-self: center;
    font-size: 18;
    color: ${(props: any) => (props.disabled ? colors.TEXT_SECONDARY : colors.WHITE)};
`;

type ButtonContainerProps = Omit<Props, 'children' | 'onClick'>;

const ButtonContainer = styled.TouchableHighlight<ButtonContainerProps>`
    align-items: center;
    justify-content: center;
    padding: 10px 18px;
    border-radius: 3px;
    background-color: ${(props: any) => getPrimaryColor(props.variant)};
    border: 1px solid ${(props: any) => getPrimaryColor(props.variant)};

    ${(props: any) =>
        props.disabled &&
        css`
            background-color: ${colors.GRAY_LIGHT};
            border: 1px solid ${colors.DIVIDER};
        `}
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
    // icon?: string | iconShape;
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
}: Props) => {
    return (
        <ButtonContainer
            onPress={onClick}
            isWhite={isWhite}
            isTransparent={isTransparent}
            isInverse={isInverse}
            isLoading={isLoading}
            variant={variant}
            underlayColor={getSecondaryColor(variant) || undefined}
            disabled={isDisabled}
        >
            <View>
                {isLoading && (
                    <Spinner size="small" color={isDisabled ? colors.TEXT_SECONDARY : 'white'} />
                )}

                <Label disabled={isDisabled}>{children}</Label>
            </View>
        </ButtonContainer>
    );
};

export default Button;
