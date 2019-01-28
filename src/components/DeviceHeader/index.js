import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import {
    getStatusColor,
    getStatusName,
    getStatus,
    getVersion,
} from 'utils/device';
import TrezorImage from 'components/images/TrezorImage';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

const Wrapper = styled.div`
    position: relative;
    height: 70px;
    width: 320px;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: 0px 25px;
    background: ${props => (props.disabled ? colors.GRAY_LIGHT : 'transparent')};
    background: ${props => (props.isSelected ? colors.WHITE : 'transparent')};
    cursor: pointer;

    border-radius: 4px 0 0 0;
    box-shadow: ${props => (props.disabled ? 'none' : '0 3px 8px rgba(0, 0, 0, 0.04)')};

    ${props => (props.isOpen || !props.isSelected) && css`
        box-shadow: none;
    `}

    ${props => props.disabled && css`
        cursor: default;
    `}

    ${props => props.isHoverable && !props.disabled && css`
        &:hover {
            background: ${colors.GRAY_LIGHT};
        }
    `}
`;

const LabelWrapper = styled.div`
    flex: 1 1 auto;
    padding-left: 18px;
    overflow: hidden;
`;

const Name = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${colors.TEXT_PRIMARY};
`;

const Status = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const IconWrapper = styled.div`
    display: flex;
    flex: 1 0 0;
    justify-content: flex-end;
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


const DeviceHeader = ({
    isOpen,
    icon,
    device,
    isHoverable = true,
    onClickWrapper,
    isAccessible = true,
    disabled = false,
    isSelected = false,
    className,
}) => {
    const status = getStatus(device);
    return (
        <Wrapper
            isSelected={isSelected}
            isOpen={isOpen}
            isHoverable={isHoverable}
            disabled={disabled}
            className={className}
            onClick={onClickWrapper}
        >
            <ImageWrapper>
                <Dot color={getStatusColor(status)} />
                <TrezorImage model={getVersion(device)} />
            </ImageWrapper>
            <LabelWrapper>
                <Name>{device.instanceLabel}</Name>
                <Status title={getStatusName(status)}>{getStatusName(status)}</Status>
            </LabelWrapper>
            <IconWrapper>
                {icon && !disabled && isAccessible && icon}
            </IconWrapper>
        </Wrapper>
    );
};

DeviceHeader.propTypes = {
    isAccessible: PropTypes.bool,
    device: PropTypes.object,
    icon: PropTypes.element,
    isHoverable: PropTypes.bool,
    disabled: PropTypes.bool,
    isOpen: PropTypes.bool,
    isSelected: PropTypes.bool,
    onClickWrapper: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default DeviceHeader;
