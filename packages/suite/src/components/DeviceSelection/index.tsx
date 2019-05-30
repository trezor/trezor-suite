import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import { State } from '@suite/types';
import { selectDevice } from '@suite/actions/suiteActions';
import styled, { css } from 'styled-components';
import { TrezorImage, colors } from '@trezor/components';
import { getStatusColor, getStatusName, getStatus } from '../../utils/device';

interface Props {
    devices: State['devices'];
    selectedDevice: State['suite']['device'];
    selectDevice: typeof selectDevice;
}

// import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

interface Props {
    devices: State['devices'];
    selectedDevice: State['suite']['device'];
    selectDevice: typeof selectDevice;
    isAccessible: boolean;
    device: any; // TODO: add type from connect
    icon: any;
    isHoverable: boolean;
    disabled: boolean;
    isOpen: boolean;
    isSelected: boolean;
    className: string;
    testId: string;
    intl: any;
}

const Wrapper = styled.div<Props>`
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

    ${props =>
        (props.isOpen || !props.isSelected) &&
        css`
            box-shadow: none;
        `}

    ${props =>
        props.disabled &&
        css`
            cursor: default;
        `}

    ${props =>
        props.isHoverable &&
        !props.disabled &&
        css`
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
    /* font-weight: ${FONT_WEIGHT.MEDIUM}; */
    color: ${colors.TEXT_PRIMARY};
`;

const Status = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    /* font-size: ${FONT_SIZE.SMALL}; */
    color: ${colors.TEXT_SECONDARY};
`;

const IconWrapper = styled.div`
    display: flex;
    flex: 1 0 0;
    justify-content: flex-end;
    align-items: center;
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

const DeviceSelection: FunctionComponent<Props> = props => {
    const {
        devices,
        selectedDevice,
        isOpen,
        icon,
        device,
        isHoverable = true,
        onClickWrapper,
        isAccessible = true,
        disabled = false,
        isSelected = false,
        className,
        testId,
        intl,
    } = props;

    if (!selectedDevice || devices.length < 1) return null;

    const options = devices.map(dev => ({
        label: dev.label,
        value: dev.path,
        device: dev,
    }));

    const onSelect = (option: any) => {
        props.selectDevice(option.device);
    };

    console.log('selectedDevice', selectedDevice);

    const value = options.find(opt => opt.device === selectedDevice);
    const status = getStatus(selectedDevice);

    return (
        <Wrapper
            isSelected={isSelected}
            data-test={testId}
            isOpen={isOpen}
            isHoverable={isHoverable}
            disabled={disabled}
            className={className}
            onClick={onClickWrapper}
        >
            <ImageWrapper>
                <Dot color={getStatusColor(status)} />
                <TrezorImage
                    height={28}
                    model={(selectedDevice.features && selectedDevice.features.major_version) || 1}
                />
            </ImageWrapper>
            <LabelWrapper>
                <Name>{selectedDevice.instanceLabel}</Name>
                <Status title={getStatusName(status, intl)}>{getStatusName(status, intl)}</Status>
            </LabelWrapper>
            <IconWrapper>{icon && !disabled && isAccessible && icon}</IconWrapper>
        </Wrapper>
    );
};

const mapStateToProps = (state: State) => ({
    devices: state.devices,
    selectedDevice: state.suite.device,
});

export default injectIntl(
    connect(
        mapStateToProps,
        dispatch => ({
            selectDevice: bindActionCreators(selectDevice, dispatch),
        }),
    )(DeviceSelection),
);
