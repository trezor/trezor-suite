import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled, { css } from 'styled-components';
import { TrezorImage, colors, variables } from '@trezor/components';
import { getStatusColor, getStatusName, getStatus } from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled.div<WrapperProps>`
    position: relative;
    height: 70px;
    width: 320px;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: 0px 20px;
    background: ${props => (props.disabled ? colors.GRAY_LIGHT : 'transparent')};
    background: ${props => (props.isSelected ? colors.WHITE : 'transparent')};
    cursor: pointer;

    border-radius: 4px 0 0 0;
    /* box-shadow: ${props => (props.disabled ? 'none' : '0 3px 8px rgba(0, 0, 0, 0.04)')}; */

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
    width: 25px;
    align-items: center;
`;
const LogoWrapper = styled.div`
    min-width: 40px;
    text-align: center;
`;

const Dot = styled.div`
    border: 2px solid ${colors.WHITE};
    border-radius: 50%;
    position: absolute;
    z-index: 10;
    background: ${props => props.color};
    top: -4px;
    right: 1px;
    width: 10px;
    height: 10px;
`;
interface Props extends React.HTMLAttributes<HTMLDivElement>, WrappedComponentProps {
    isAccessible?: boolean;
    device: TrezorDevice;
    icon?: React.ReactNode;
    isHoverable?: boolean;
    disabled?: boolean;
    isSelected?: boolean;
    className?: string;
}

type WrapperProps = Pick<Props, 'isSelected' | 'isHoverable' | 'disabled' | 'className'>;

const DeviceItem = ({
    icon,
    device,
    isHoverable = true,
    isAccessible = true,
    disabled = false,
    isSelected = false,
    className,
    intl,
    ...rest
}: Props) => {
    const status = getStatus(device);

    return (
        <Wrapper
            isSelected={isSelected}
            isHoverable={isHoverable}
            disabled={disabled}
            className={className}
            {...rest}
        >
            <LogoWrapper>
                <ImageWrapper>
                    <Dot color={getStatusColor(status)} />
                    <TrezorImage
                        height={28}
                        model={(device.features && device.features.major_version) || 1}
                    />
                </ImageWrapper>
            </LogoWrapper>
            <LabelWrapper>
                <Name>{device.instanceLabel}</Name>
                <Status title={getStatusName(status, intl)}>{getStatusName(status, intl)}</Status>
            </LabelWrapper>
            <IconWrapper>{icon && !disabled && isAccessible && icon}</IconWrapper>
        </Wrapper>
    );
};

export default injectIntl(DeviceItem);
