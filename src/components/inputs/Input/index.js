import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import ICONS from 'config/icons';
import Icon from 'components/Icon';
import {
    FONT_SIZE,
    FONT_WEIGHT,
    TRANSITION,
    FONT_FAMILY,
} from 'config/variables';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const InputWrapper = styled.div`
    display: flex;
`;

const InputIconWrapper = styled.div`
    flex: 1;
    position: relative;
    display: inline-block;
`;

const TopLabel = styled.span`
    padding-bottom: 4px;
    color: ${colors.TEXT_SECONDARY};
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 6px 12px;

    line-height: 1.42857143;
    font-family: ${FONT_FAMILY.MONOSPACE};
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.BASE};
    color: ${colors.TEXT_PRIMARY};

    border-radius: 2px;
    ${props => props.hasAddon && css`
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    `}
    border: 1px solid ${colors.DIVIDER};
    border-color: ${props => props.borderColor};

    background-color: ${colors.WHITE};
    transition: ${TRANSITION.HOVER};
    &:disabled {
        pointer-events: none;
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    left: auto;
    right: 10px;
`;

const BottomText = styled.span`
    margin-top: 10px;
    font-size: ${FONT_SIZE.SMALLER};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
`;

class Input extends Component {
    getIcon(inputState) {
        let icon = [];
        if (inputState === 'success') {
            icon = ICONS.CHECKED;
        } else if (inputState === 'warning') {
            icon = ICONS.WARNING;
        } else if (inputState === 'error') {
            icon = ICONS.ERROR;
        }
        return icon;
    }

    getColor(inputState) {
        let color = '';
        if (inputState === 'success') {
            color = colors.SUCCESS_PRIMARY;
        } else if (inputState === 'warning') {
            color = colors.WARNING_PRIMARY;
        } else if (inputState === 'error') {
            color = colors.ERROR_PRIMARY;
        }
        return color;
    }

    render() {
        return (
            <Wrapper
                className={this.props.className}
            >
                {this.props.topLabel && (
                    <TopLabel>{this.props.topLabel}</TopLabel>
                )}
                <InputWrapper>
                    <InputIconWrapper>
                        {this.props.state && (
                            <StyledIcon
                                icon={this.getIcon(this.props.state)}
                                color={this.getColor(this.props.state)}
                            />
                        )}
                        <StyledInput
                            innerRef={this.props.innerRef}
                            hasAddon={!!this.props.sideAddons}
                            type={this.props.type}
                            placeholder={this.props.placeholder}
                            autoComplete={this.props.autoComplete}
                            autoCorrect={this.props.autoCorrect}
                            autoCapitalize={this.props.autoCapitalize}
                            spellCheck={this.props.spellCheck}
                            value={this.props.value}
                            onChange={this.props.onChange}
                            borderColor={this.getColor(this.props.state)}
                            disabled={this.props.isDisabled}
                        />
                    </InputIconWrapper>
                    {this.props.sideAddons && this.props.sideAddons.map(sideAddon => sideAddon)}
                </InputWrapper>
                {this.props.bottomText && (
                    <BottomText
                        color={this.getColor(this.props.state)}
                    >
                        {this.props.bottomText}
                    </BottomText>
                )}
            </Wrapper>
        );
    }
}

Input.propTypes = {
    className: PropTypes.string,
    innerRef: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    autoComplete: PropTypes.string,
    autoCorrect: PropTypes.string,
    autoCapitalize: PropTypes.string,
    spellCheck: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    state: PropTypes.string,
    bottomText: PropTypes.string,
    topLabel: PropTypes.node,
    sideAddons: PropTypes.arrayOf(PropTypes.node),
    isDisabled: PropTypes.bool,
};

Input.defaultProps = {
    type: 'text',
};

export default Input;
