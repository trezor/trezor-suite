import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import colors from 'config/css/colors';
import variables from 'config/css/variables';

import TickImage from './images/tick.svg';

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

const Icon = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background: ${colors.CORE_WHITE};
    border: 2px solid ${props => (props.checked ? colors.BLUE : colors.LIGHT_GRAY_2)};
    width: 16px;
    height: 16px;

    ${/*sc-selector*/Wrapper}:hover &,
    ${/*sc-selector*/Wrapper}:focus & {
        border: 2px solid ${colors.BLUE};
    }

    ${/*sc-selector*/Wrapper}:hover & {
        background: ${props => (props.checked ? colors.BLUE : colors.CORE_WHITE)};

        * {
            fill: ${props => (props.checked ? colors.CORE_WHITE : colors.BLUE)};
        }
    }
`;

const Label = styled.div`
    display: flex;
    padding-left: 5px;
    font-weight: ${variables.FONT.WEIGHT.LIGHT};
    justify-content: center;

    ${/*sc-selector*/Wrapper}:hover &,
    ${/*sc-selector*/Wrapper}:focus & {
        color: ${props => (props.checked ? colors.DARK_GRAY_1 : colors.BLUE)};
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
                <Icon
                    checked={checked}
                >
                    {checked && (
                        <Tick>
                            <TickImage fill={colors.BLUE} />
                        </Tick>
                    )
                    }
                </Icon>
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
