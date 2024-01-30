import React from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import { variables, DeviceAnimation, Image } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';

const Confirmed = styled.div`
    display: flex;
    height: 60px;
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    background: ${({ theme }) => theme.BG_GREY};
    align-items: center;
    justify-content: center;
    margin-top: 27px;
    gap: 10px;
`;

const StyledImage = styled(Image)`
    height: 34px;
`;

interface ConfirmedOnTrezorProps {
    device?: TrezorDevice;
}

export const ConfirmedOnTrezor = ({ device }: ConfirmedOnTrezorProps) => {
    const deviceModelInternal = device?.features?.internal_model;

    return (
        <Confirmed>
            {deviceModelInternal === DeviceModelInternal.T2B1 && (
                <DeviceAnimation
                    type="ROTATE"
                    height="34px"
                    width="34px"
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={device?.features?.unit_color}
                />
            )}
            {deviceModelInternal && deviceModelInternal !== DeviceModelInternal.T2B1 && (
                <StyledImage alt="Trezor" image={`TREZOR_${deviceModelInternal}`} />
            )}

            <Translation id="TR_BUY_CONFIRMED_ON_TREZOR" />
        </Confirmed>
    );
};
