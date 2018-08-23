import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { getStatusColor, getStatusName } from 'utils/device';
import TrezorImage from 'components/TrezorImage';

import colors from 'config/colors';

const Wrapper = styled.div`
    position: relative;
    height: 64px;
    width: 320px;
    display: flex;
    align-items: center;
    background: ${colors.WHITE};
    border-bottom: 1px solid ${colors.DIVIDER};
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);

    ${props => props.isOpen && css`
        border-bottom: 1px solid ${colors.WHITE};
        box-shadow: none;
    `}
`;

const ClickWrapper = styled.div`
    width: 100%;
    display: flex;
    padding-left: 25px;
    height: 100%;
    align-items: center;
    cursor: pointer;

    ${props => props.disabled && css`
        cursor: initial;
    `}
`;

const LabelWrapper = styled.div`
    flex: 1;
    padding-left: 18px;
`;

const Name = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: no-wrap;
    font-weight: 500;
    font-size: 14px;
    color: ${colors.TEXT_PRIMARY};
`;

const Status = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: 12px;
    color: ${colors.TEXT_SECONDARY};
`;

const Counter = styled.div`
    border: 1px solid ${colors.DIVIDER};
    border-radius: 50%;
    color: ${colors.TEXT_SECONDARY};
    width: 24px;
    height: 24px;
    line-height: 22px;
    text-align: center;
    font-size: 11px;
    margin-right: 8px;
`;

const IconWrapper = styled.div`
    padding-right: 25px;
    display: flex;
`;

const ImageWrapper = styled.div`
    position: relative;
`;

const Dot = styled.div`
    border: 2px solid ${colors.WHITE};
    border-radius: 50%;
    position: absolute;
    z-index: 10;
    background: ${props => props.color};
    top: -4px;
    right: -3px;
    width: 10px;
    height: 10px;
`;

class DeviceHeader extends Component {
    constructor(props) {
        super(props);
        this.state = {
            clicked: false,
        };
    }

    handleClick() {
        this.setState({ clicked: true });
        if (!this.props.disabled) {
            this.props.handleOpen();
        }
    }

    render() {
        const {
            status, label, deviceCount, isOpen, trezorModel, disabled,
        } = this.props;
        return (
            <Wrapper isOpen={isOpen}>
                <ClickWrapper disabled={disabled} onClick={() => this.handleClick()}>
                    <ImageWrapper>
                        <Dot color={getStatusColor(status)} />
                        <TrezorImage model={trezorModel} />
                    </ImageWrapper>
                    <LabelWrapper>
                        <Name>{label}</Name>
                        <Status>{getStatusName(status)}</Status>
                    </LabelWrapper>
                    <IconWrapper>
                        {deviceCount > 1 && <Counter>{deviceCount}</Counter>}
                        {!disabled && (
                            <Icon
                                canAnimate={this.state.clicked === true}
                                isActive={isOpen}
                                size={25}
                                color={colors.TEXT_SECONDARY}
                                icon={icons.ARROW_DOWN}
                            />
                        )
                        }
                    </IconWrapper>
                </ClickWrapper>
            </Wrapper>
        );
    }
}


DeviceHeader.propTypes = {
    deviceCount: PropTypes.number,
    disabled: PropTypes.bool,
    isOpen: PropTypes.bool,
    trezorModel: PropTypes.string.isRequired,
    handleOpen: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
};

export default DeviceHeader;
