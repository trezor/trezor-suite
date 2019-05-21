import React from 'react';
import styled, {css} from 'styled-components/native';
import { FONT_SIZE_NATIVE as FONT_SIZE, FONT_WEIGHT, TRANSITION } from '../../../config/variables';
import { getPrimaryColor, getSecondaryColor } from '../../../utils/colors';
import colors from '../../../config/colors';

const Spinner = styled.ActivityIndicator`
    padding-right: 10px;
`;

const View = styled.View`
    flex-direction: row;
`;

const Label = styled.Text`
    font-weight: 400;
    align-self: center;
    font-size: 18;
    color: ${(props: any) => props.disabled? colors.TEXT_SECONDARY : colors.WHITE};
`

const ButtonContainer = styled.TouchableHighlight`
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
`

interface Props {
    additionalClassName?: string;
    variant: 'success' | 'info' | 'warning' | 'error';
    isDisabled?: boolean;
    isInverse?: boolean;
    isWhite?: boolean;
    isTransparent?: boolean;
    isLoading?: boolean;
    children: string;
    onClick: () => void;
    // icon?: string | iconShape;
}

const Button = ({
    children,
    onClick,
    additionalClassName,
    variant = 'success',
    isDisabled = false,
    isWhite = false,
    isTransparent = false,
    isInverse = false,
    isLoading = false,
    ...rest
}: Props) => {
    return (
            <ButtonContainer
                onPress={onClick}
                isWhite={isWhite}
                isTransparent={isTransparent}
                isInverse={isInverse}
                isLoading={isLoading}
                variant={variant}
                underlayColor={getSecondaryColor(variant)}
                disabled={isDisabled}
            >
                <View>
                    {isLoading && <Spinner size="small" color={isDisabled? colors.TEXT_SECONDARY : 'white'}/>}


                    <Label disabled={isDisabled}>
                        {children}
                    </Label>
                </View>

            </ButtonContainer>
    );
};


export default Button;