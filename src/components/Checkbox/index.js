import React, { PureComponent } from 'react';
import styled, { css } from 'styled-components';

import { FONT_SIZE } from 'config/variables';
import Icon from 'components/Icon';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import icons from 'config/icons';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    cursor: pointer;
    align-items: center;

    &:hover,
    &:focus {
        outline: none;
    }
`;

const Tick = styled.div``;

const IconWrapper = styled.div`
    display: flex;
    border-radius: 2px;
    justify-content: center;
    align-items: center;
    color: ${props => (props.isChecked ? colors.WHITE : colors.GREEN_PRIMARY)};
    background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    border: 1px solid ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.DIVIDER)};
    width: 24px;
    height: 24px;

    &:hover,
    &:focus {
        ${props => !props.isChecked
            && css`
                border: 1px solid ${colors.GREEN_PRIMARY};
            `}
        background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    }
`;

const Label = styled.div`
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

class Checkbox extends PureComponent {
    handleKeyboard(event) {
        if (event.keyCode === 32) {
            this.props.onClick(event);
        }
    }

    render() {
        const { isChecked, children, onClick } = this.props;
        return (
            <Wrapper
                onClick={onClick}
                onKeyUp={event => this.handleKeyboard(event)}
                tabIndex={0}
            >
                <IconWrapper isChecked={isChecked}>
                    {isChecked && (
                        <Tick>
                            <Icon
                                hoverColor={colors.WHITE}
                                size={26}
                                color={
                                    isChecked
                                        ? colors.WHITE
                                        : colors.GREEN_PRIMARY
                                }
                                icon={icons.SUCCESS}
                            />
                        </Tick>
                    )}
                </IconWrapper>
                <Label isChecked={isChecked}>{children}</Label>
            </Wrapper>
        );
    }
}

Checkbox.propTypes = {
    onClick: PropTypes.func.isRequired,
    isChecked: PropTypes.bool,
    children: PropTypes.string,
};

export default Checkbox;
