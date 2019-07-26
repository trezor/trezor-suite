import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

import { GestureResponderEvent } from 'react-native';
import { FONT_SIZE_NATIVE as FONT_SIZE } from '../../config/variables';
import Icon from '../Icon';
import colors from '../../config/colors';
import icons from '../../config/icons';
import { Omit } from '../../support/types';

const Touchable = styled.TouchableWithoutFeedback``;

const Wrapper = styled.View`
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
`;

interface Props {
    onClick: (event: GestureResponderEvent) => any;
    isChecked: boolean;
    children?: React.ReactNode;
}

type IconWrapperProps = Omit<Props, 'onClick'>;

const Checkbox = ({ onClick, isChecked, children, ...rest }: Props) => {
    return (
        <Touchable onPress={onClick} {...rest}>
            <Wrapper>
                <IconWrapper isChecked={isChecked}>
                    {isChecked && (
                        <Icon
                            hoverColor={colors.WHITE}
                            size={10}
                            color={isChecked ? colors.WHITE : colors.GREEN_PRIMARY}
                            icon="SUCCESS"
                        />
                    )}
                </IconWrapper>
                <Label isChecked={isChecked}>{children}</Label>
            </Wrapper>
        </Touchable>
    );
};

Checkbox.propTypes = {
    onClick: PropTypes.func.isRequired,
    isChecked: PropTypes.bool,
    children: PropTypes.node,
};

export default Checkbox;
