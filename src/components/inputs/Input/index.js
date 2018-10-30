import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import ICONS from 'config/icons';
import Icon from 'components/Icon';
import {
    FONT_SIZE,
    FONT_WEIGHT,
    TRANSITION,
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
    background: white;
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const StyledInput = styled.input`
    width: 100%;
    height: 40px;
    padding: 5px ${props => (props.hasIcon ? '40px' : '12px')} 6px 12px;

    line-height: 1.42857143;
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.BASE};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};

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
    top: 3px;
    right: 10px;
`;

const BottomText = styled.span`
    margin-top: 10px;
    font-size: ${FONT_SIZE.SMALLER};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
`;

const Overlay = styled.div`
    ${props => props.isPartiallyHidden && css`
        bottom: 0;
        border: 1px solid ${colors.DIVIDER};
        border-radius: 2px;
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(to right, 
            rgba(0,0,0, 0) 0%,
            rgba(255,255,255, 1) 220px
        );
    `}
`;

class Input extends PureComponent {
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
                        <Overlay isPartiallyHidden={this.props.isPartiallyHidden} />
                        {this.props.icon}
                        <StyledInput
                            hasIcon={this.getIcon(this.props.state).length > 0}
                            innerRef={this.props.innerRef}
                            hasAddon={!!this.props.sideAddons}
                            type={this.props.type}
                            color={this.getColor(this.props.state)}
                            placeholder={this.props.placeholder}
                            autocomplete={this.props.autocomplete}
                            autocorrect={this.props.autocorrect}
                            autocapitalize={this.props.autocapitalize}
                            spellCheck={this.props.spellCheck}
                            value={this.props.value}
                            onChange={this.props.onChange}
                            borderColor={this.getColor(this.props.state)}
                            disabled={this.props.isDisabled}
                            name={this.props.name}
                            data-lpignore="true"
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
    autocomplete: PropTypes.string,
    autocorrect: PropTypes.string,
    autocapitalize: PropTypes.string,
    icon: PropTypes.node,
    spellCheck: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    state: PropTypes.string,
    bottomText: PropTypes.string,
    topLabel: PropTypes.node,
    sideAddons: PropTypes.arrayOf(PropTypes.node),
    isDisabled: PropTypes.bool,
    name: PropTypes.string,
    isPartiallyHidden: PropTypes.bool,
};

Input.defaultProps = {
    type: 'text',
};

export default Input;
