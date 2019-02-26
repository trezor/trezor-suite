import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import ICONS from 'config/icons';
import Icon from 'components/Icon';
import {
    FONT_SIZE,
    FONT_FAMILY,
    FONT_WEIGHT,
    LINE_HEIGHT,
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
    height: ${props => (props.height ? `${props.height}px` : '40px')};
    padding: 5px ${props => (props.hasIcon ? '40px' : '12px')} 6px 12px;

    font-family: ${FONT_FAMILY.MONOSPACE};
    line-height: ${LINE_HEIGHT.SMALL};
    font-size: ${props => (props.isSmallText ? `${FONT_SIZE.SMALL}` : `${FONT_SIZE.BASE}`)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${props => (props.color ? props.color : colors.TEXT)};

    border-radius: 2px;
    
    ${props => props.hasAddon && css`
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    `}

    border: 1px solid ${colors.DIVIDER};
    border-color: ${props => props.borderColor};

    background-color: ${colors.WHITE};
    transition: ${TRANSITION.HOVER};

    &:focus {
        border-color: ${colors.INPUT_FOCUSED_BORDER};
        box-shadow: 0 0px 6px 0 ${colors.INPUT_FOCUSED_SHADOW};
    }

    &:disabled {
        pointer-events: none;
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:read-only  {
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    ${props => props.trezorAction && css`
        z-index: 10001;
        position: relative; /* bigger than modal container */
        border-color: ${colors.WHITE};
        border-width: 2px;
        transform: translate(-1px, -1px);
        background: ${colors.DIVIDER};
    `};
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    left: auto;
    top: 3px;
    right: 10px;
`;

const BottomText = styled.span`
    margin-top: 10px;
    font-size: ${FONT_SIZE.SMALL};
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
            rgba(249,249,249, 1) 220px
        );
    `}
`;

const TrezorAction = styled.div`
    display: ${props => (props.action ? 'flex' : 'none')};
    align-items: center;
    height: 37px;
    margin: 0px 10px;
    padding: 0 14px 0 5px;
    position: absolute;
    top: 45px;
    background: black;
    color: ${colors.WHITE};
    border-radius: 5px;
    line-height: ${LINE_HEIGHT.TREZOR_ACTION};
    z-index: 10002;
    transform: translate(-1px, -1px);
`;

const ArrowUp = styled.div`
    position: absolute;
    top: -9px;
    left: 12px;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid black;
    z-index: 10001;
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
                            autoComplete="off"
                            height={this.props.height}
                            trezorAction={this.props.trezorAction}
                            hasIcon={this.props.icon || this.getIcon(this.props.state).length > 0}
                            ref={this.props.innerRef}
                            hasAddon={!!this.props.sideAddons}
                            type={this.props.type}
                            color={this.getColor(this.props.state)}
                            placeholder={this.props.placeholder}
                            autoCorrect={this.props.autocorrect}
                            autoCapitalize={this.props.autocapitalize}
                            spellCheck={this.props.spellCheck}
                            isSmallText={this.props.isSmallText}
                            value={this.props.value}
                            readOnly={this.props.readOnly}
                            onChange={this.props.onChange}
                            onClick={this.props.autoSelect ? event => event.target.select() : null}
                            borderColor={this.getColor(this.props.state)}
                            disabled={this.props.isDisabled}
                            name={this.props.name}
                            data-lpignore="true"
                        />
                        <TrezorAction action={this.props.trezorAction}>
                            <ArrowUp />{this.props.trezorAction}
                        </TrezorAction>
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
    height: PropTypes.number,
    autocorrect: PropTypes.string,
    autocapitalize: PropTypes.string,
    icon: PropTypes.node,
    spellCheck: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    autoSelect: PropTypes.bool,
    onChange: PropTypes.func,
    state: PropTypes.string,
    bottomText: PropTypes.string,
    topLabel: PropTypes.node,
    trezorAction: PropTypes.node,
    sideAddons: PropTypes.arrayOf(PropTypes.node),
    isDisabled: PropTypes.bool,
    name: PropTypes.string,
    isSmallText: PropTypes.bool,
    isPartiallyHidden: PropTypes.bool,
};

Input.defaultProps = {
    type: 'text',
    autoSelect: false,
    height: 40,
};

export default Input;
