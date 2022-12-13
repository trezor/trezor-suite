import React from 'react';
import styled from 'styled-components';
import Bignumber from 'bignumber.js';

import { Account } from '@wallet-types/index';

import AuthConfirmFailed from '../../AccountMode/AuthConfirmFailed';
import BackendDisconnected from '../../AccountMode/BackendDisconnected';
import DeviceUnavailable from '../../AccountMode/DeviceUnavailable';
import XRPReserve from '../../AccountAnnouncement/XRPReserve';
import AccountImported from '../../AccountAnnouncement/AccountImported';
import AccountOutOfSync from '../../AccountAnnouncement/AccountOutOfSync';

const BannersWrapper = styled.div`
    display: flex;
    flex-direction: column;

    :has(*) {
        margin-bottom: 10px;
    }
`;

const RippleReserve = ({ account }: { account: Extract<Account, { networkType: 'ripple' }> }) => {
    const bigBalance = new Bignumber(account.balance);
    const bigReserve = new Bignumber(account.misc.reserve);
    return bigBalance.isLessThan(bigReserve) ? <XRPReserve reserve={account.misc.reserve} /> : null;
};

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => (
    <BannersWrapper>
        <AuthConfirmFailed />
        <BackendDisconnected />
        <DeviceUnavailable />
        {account?.networkType === 'ripple' && <RippleReserve account={account} />}
        {account?.imported && <AccountImported />}
        {account?.backendType === 'coinjoin' && account.status === 'out-of-sync' && (
            <AccountOutOfSync />
        )}
    </BannersWrapper>
);
