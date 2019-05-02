import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT, TRANSITION } from 'config/variables';
import React, { PureComponent } from 'react';
import styled, { css } from 'styled-components';
import { getStateIcon } from 'utils/icons';
import { getPrimaryColor } from 'utils/colors';

import Icon from 'components/Icon';
import PropTypes from 'prop-types';
import colors from 'config/colors';

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
    box-sizing: border-box;

    border-radius: 2px;
    
    ${props =>
        props.hasAddon &&
        css`
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    border: 1px solid ${props => props.border || colors.INPUT_BORDER};

    background-color: ${colors.WHITE};
    transition: ${TRANSITION.HOVER};

    &:disabled {
        pointer-events: none;
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:read-only  {
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:focus {
        box-shadow: ${colors.INPUT_FOCUS_SHADOW} 0px 0px 6px 0px;
        border-color: ${props => props.border || colors.INPUT_FOCUS_BORDER};
        outline: none;
    }

    ${props =>
        props.trezorAction &&
        css`
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
    top: 12px;
    right: 15px;
`;

const BottomText = styled.span`
    margin-top: 10px;
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
`;

const Overlay = styled.div`
    ${props =>
        props.isPartiallyHidden &&
        css`
            bottom: 0;
            border: 1px solid ${colors.DIVIDER};
            border-radius: 2px;
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 0) 0%,
                rgba(249, 249, 249, 1) 220px
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
    render() {
        return (
            <Wrapper className={this.props.className}>
                {this.props.topLabel && <TopLabel>{this.props.topLabel}</TopLabel>}
                <InputWrapper>
                    <InputIconWrapper>
                        {this.props.state && (
                            <StyledIcon
                                icon={getStateIcon(this.props.state)}
                                color={getPrimaryColor(this.props.state)}
                                size={16}
                            />
                        )}
                        <Overlay isPartiallyHidden={this.props.isPartiallyHidden} />
                        {this.props.icon}
                        <StyledInput
                            autoComplete="off"
                            height={this.props.height}
                            trezorAction={this.props.trezorAction}
                            hasIcon={this.props.icon || getStateIcon(this.props.state)}
                            ref={this.props.innerRef}
                            hasAddon={!!this.props.sideAddons}
                            type={this.props.type}
                            color={getPrimaryColor(this.props.state)}
                            placeholder={this.props.placeholder}
                            autoCorrect={this.props.autocorrect}
                            autoCapitalize={this.props.autocapitalize}
                            spellCheck={this.props.spellCheck}
                            isSmallText={this.props.isSmallText}
                            value={this.props.value}
                            readOnly={this.props.readOnly}
                            onChange={this.props.onChange}
                            onClick={this.props.autoSelect ? event => event.target.select() : null}
                            border={getPrimaryColor(this.props.state)}
                            disabled={this.props.isDisabled}
                            name={this.props.name}
                            data-lpignore="true"
                        />
                        <TrezorAction action={this.props.trezorAction}>
                            <ArrowUp />
                            {this.props.trezorAction}
                        </TrezorAction>
                    </InputIconWrapper>
                    {this.props.sideAddons && this.props.sideAddons.map(sideAddon => sideAddon)}
                </InputWrapper>
                {this.props.bottomText && (
                    <BottomText color={getPrimaryColor(this.props.state)}>
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
    state: PropTypes.oneOf(['success', 'warning', 'error']),
    bottomText: PropTypes.node,
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
