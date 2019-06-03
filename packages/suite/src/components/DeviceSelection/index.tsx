import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import { State, Omit, TrezorDevice } from '@suite/types';
import { selectDevice } from '@suite/actions/suiteActions';
import styled, { css } from 'styled-components';
import { TrezorImage, colors, variables } from '@trezor/components';
import { getStatusColor, getStatusName, getStatus } from '../../utils/device';

const Wrapper = styled.div<WrapperProps>`
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
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.TEXT_PRIMARY};
`;

const Status = styled.div`
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
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
interface Props extends React.HTMLAttributes<HTMLDivElement> {
    devices: State['devices'];
    selectedDevice: State['suite']['device'];
    selectDevice: typeof selectDevice;
    isAccessible: boolean;
    onClickWrapper: () => void;
    device: any; // TODO: add type from connect
    icon: any;
    isHoverable: boolean;
    disabled: boolean;
    isOpen: boolean;
    isSelected: boolean;
    className: string;
    intl: any;
}

type WrapperProps = Omit<
    Props,
    | 'onSelect'
    | 'devices'
    | 'selectedDevice'
    | 'selectDevice'
    | 'isAccessible'
    | 'icon'
    | 'intl'
    | 'device'
    | 'onClickWrapper'
>;

const DeviceSelection = ({
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
    intl,
    selectDevice,
    ...rest
}: Props) => {
    if (!selectedDevice || devices.length < 1) return null;

    const options = devices.map((dev: TrezorDevice) => ({
        label: dev.label,
        value: dev.path,
        device: dev,
    }));

    const onSelect = (option: any) => {
        selectDevice(option.device);
    };

    const value = options.find(opt => opt.device === selectedDevice);
    const status = getStatus(selectedDevice);

    return (
        <Wrapper
            isSelected={isSelected}
            isOpen={isOpen}
            isHoverable={isHoverable}
            disabled={disabled}
            className={className}
            onClick={onClickWrapper}
            {...rest}
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
