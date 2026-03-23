import React from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { RotateDeviceImage } from '@trezor/product-components';
import { borders, typography } from '@trezor/theme';

const Confirmed = styled.div`
    display: flex;
    height: 60px;
    ${typography['body-md-strong']}
    background: ${({ theme }) => theme.backgroundNeutralBoldInverted};
    align-items: center;
    justify-content: center;
    margin-top: 27px;
    gap: 10px;
    border-radius: ${borders.radii.sm};
`;

interface ConfirmedOnTrezorProps {
    device?: TrezorDevice;
}

export const ConfirmedOnTrezor = ({ device }: ConfirmedOnTrezorProps) => (
    <Confirmed data-testid="@trading/offer/confirm-on-trezor-button">
        <RotateDeviceImage
            deviceModel={device?.features?.internal_model}
            deviceColor={device?.features?.unit_color}
            height={34}
            width={34}
        />

        <Translation id="TR_BUY_CONFIRMED_ON_TREZOR" />
    </Confirmed>
);
