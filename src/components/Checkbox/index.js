import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { FONT_SIZE } from 'config/variables';

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

const Tick = styled.div`
`;

const IconWrapper = styled.div`
    display: flex;
    border-radius: 2px;
    justify-content: center;
    align-items: center;
    color: ${props => (props.checked ? colors.WHITE : colors.GREEN_PRIMARY)};
    background: ${props => (props.checked ? colors.GREEN_PRIMARY : colors.WHITE)};
    border: 1px solid ${props => (props.checked ? colors.GREEN_PRIMARY : colors.DIVIDER)};
    width: 24px;
    height: 24px;

    &:hover,
    &:focus {
        ${props => !props.checked && css`
            border: 1px solid ${colors.GREEN_PRIMARY};
        `}
        background: ${props => (props.checked ? colors.GREEN_PRIMARY : colors.WHITE)};
    }
`;

const Label = styled.div`
    display: flex;
    padding-left: 10px;
    justify-content: center;
    ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.SMALL};

    &:hover,
    &:focus {
        color: ${props => (props.checked ? colors.TEXT_PRIMARY : colors.TEXT_PRIMARY)};
    }
`;

class Checkbox extends PureComponent {
    handleKeyboard(e) {
        if (e.keyCode === 32) {
            this.props.onClick(e);
        }
    }

    render() {
        const {
            checked,
            children,
            onClick,
        } = this.props;
        return (
            <Wrapper
                onClick={onClick}
                onKeyUp={e => this.handleKeyboard(e)}
                tabIndex={0}
            >
                <IconWrapper checked={checked}>
                    {checked && (
                        <Tick>
                            <Icon size={26} color={checked ? colors.WHITE : colors.GREEN_PRIMARY} icon={icons.SUCCESS} />
                        </Tick>
                    )
                    }
                </IconWrapper>
                <Label checked={checked}>{children}</Label>
            </Wrapper>
        );
    }
}

Checkbox.propTypes = {
    onClick: PropTypes.func.isRequired,
    checked: PropTypes.bool,
    children: PropTypes.string,
};

export default Checkbox;
