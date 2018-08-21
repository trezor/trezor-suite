import React from 'react';
import styled from 'styled-components';
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
`;

const ClickWrapper = styled.div`
    width: 100%;
    display: flex;
    padding-left: 22px;
    height: 100%;
    align-items: center;
    cursor: pointer;
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

const StyledIcon = styled(Icon)`
    transform: rotate(180deg);
`;

const DeviceHeader = ({
    disabled = false,
    handleOpen,
    status,
    label,
    deviceCount,
    isOpen = false,
    trezorModel,
}) => (
    <Wrapper>
        <ClickWrapper onClick={!disabled ? handleOpen : null}>
            <TrezorImage
                status={status}
                model={trezorModel}
            />
            <LabelWrapper>
                <Name>{label}</Name>
                <Status>{getStatusName(status)}</Status>
            </LabelWrapper>
            <IconWrapper>
                {deviceCount > 1 ? <Counter>{deviceCount}</Counter> : null}
                <StyledIcon
                    isOpen={isOpen}
                    size={25}
                    color={colors.TEXT_SECONDARY}
                    icon={icons.ARROW_DOWN}
                />
            </IconWrapper>
        </ClickWrapper>
    </Wrapper>
);

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
