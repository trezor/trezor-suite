import React from 'react';
import styled from 'styled-components/native';

import { GestureResponderEvent } from 'react-native';
import { FONT_SIZE_NATIVE as FONT_SIZE } from '../../config/variables';
import Icon from '../Icon';
import colors from '../../config/colors';
import icons from '../../config/icons';
import { Omit } from '../../support/types';

const Wrapper = styled.TouchableWithoutFeedback`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const IconWrapper = styled.View<IconWrapperProps>`
    display: flex;
    border-radius: 2px;
    justify-content: center;
    align-items: center;
    color: ${props => (props.isChecked ? colors.WHITE : colors.GREEN_PRIMARY)};
    background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    border: 1px solid ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.DIVIDER)};
    width: 24px;
    height: 24px;
`;

const Label = styled.Text<IconWrapperProps>`
    display: flex;
    padding-left: 10px;
    justify-content: center;
    ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.BASE};

    &:hover,
    &:focus {
        color: ${props => (props.isChecked ? colors.TEXT_PRIMARY : colors.TEXT_PRIMARY)};
    }
`;

interface Props {
    onClick: (event: GestureResponderEvent) => any;
    isChecked: boolean;
    propTypes: any;
    children?: React.ReactNode;
}

type IconWrapperProps = Omit<Props, 'onClick' | 'propTypes'>;

const Checkbox = ({ isChecked, children, onClick, ...rest }: Props) => {
    return (
        <Wrapper onPress={onClick} {...rest}>
            <IconWrapper isChecked={isChecked}>
                {isChecked && (
                    <Icon
                        hoverColor={colors.WHITE}
                        size={10}
                        color={isChecked ? colors.WHITE : colors.GREEN_PRIMARY}
                        icon={icons.SUCCESS}
                    />
                )}
            </IconWrapper>
            <Label isChecked={isChecked}>{children}</Label>
        </Wrapper>
    );
};

export default Checkbox;
