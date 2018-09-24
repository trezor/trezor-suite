import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import icons from 'config/icons';
import {
    getStatusColor,
    getStatusName,
    isDisabled,
    getStatus,
    getVersion,
} from 'utils/device';
import TrezorImage from 'components/images/TrezorImage';
import colors from 'config/colors';

const Wrapper = styled.div`
    position: relative;
    height: 70px;
    width: 320px;
    display: flex;
    align-items: center;
    background: ${colors.WHITE};
    border-radius: 4px 0 0 0;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);

    ${props => props.isOpen && css`
        box-shadow: none;
    `}

    ${props => props.isHoverable && css`
        &:hover {
            background: ${colors.GRAY_LIGHT};
        }
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
    white-space: nowrap;
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

    isDisabled(device, devices, transport) {
        return isDisabled(device, devices, transport);
    }

    handleClickWrapper() {
        this.setState({ clicked: true });
        if (!this.props.disabled) {
            this.props.onClickWrapper();
        }
    }

    render() {
        const {
            isOpen, icon, device, devices, transport, isHoverable,
        } = this.props;
        const status = getStatus(device);
        const disabled = isDisabled(device, devices, transport);
        const deviceCount = devices.length;

        return (
            <Wrapper isOpen={isOpen} isHoverable={isHoverable}>
                <ClickWrapper disabled={disabled} onClick={() => this.handleClickWrapper()}>
                    <ImageWrapper>
                        <Dot color={getStatusColor(status)} />
                        <TrezorImage model={getVersion(device)} />
                    </ImageWrapper>
                    <LabelWrapper>
                        <Name>{device.instanceLabel}</Name>
                        <Status>{getStatusName(status)}</Status>
                    </LabelWrapper>
                    <IconWrapper>
                        {icon && icon}
                        {!icon && deviceCount > 1 && <Counter>{deviceCount}</Counter>}
                        {!icon && !disabled && (
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
    device: PropTypes.object,
    devices: PropTypes.array,
    transport: PropTypes.object,
    icon: PropTypes.element,
    isHoverable: PropTypes.bool,
    disabled: PropTypes.bool,
    isOpen: PropTypes.bool,
    onClickWrapper: PropTypes.func.isRequired,
};

export default DeviceHeader;
