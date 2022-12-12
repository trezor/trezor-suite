import React from 'react';
import styled from 'styled-components';

import { Account } from '@wallet-types';

import AuthConfirmFailed from '../../AccountMode/AuthConfirmFailed';
import BackendDisconnected from '../../AccountMode/BackendDisconnected';
import DeviceUnavailable from '../../AccountMode/DeviceUnavailable';
import { XRPReserve } from '../../AccountAnnouncement/XRPReserve';
import { AccountImported } from '../../AccountAnnouncement/AccountImported';
import { AccountOutOfSync } from '../../AccountAnnouncement/AccountOutOfSync';
import { TorDisconnected } from '../../AccountAnnouncement/TorDisconnected';
import { CoinJoinContextMessage } from '../../AccountAnnouncement/CoinJoinContextMessage';

const BannersWrapper = styled.div`
    display: flex;
    flex-direction: column;

    :has(*) {
        margin-bottom: 10px;
    }
`;

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => (
    <BannersWrapper>
        <CoinJoinContextMessage account={account} />
        <AuthConfirmFailed />
        <BackendDisconnected />
        <DeviceUnavailable />
        <TorDisconnected />
        <XRPReserve account={account} />
        <AccountImported account={account} />
        <AccountOutOfSync account={account} />
    </BannersWrapper>
);
