import * as React from 'react';
import styled from 'styled-components';
import Bignumber from 'bignumber.js';
import { Account } from '@wallet-types/index';

import XRPReserve from './XRPReserve';
import AccountImported from './AccountImported';

const AnnouncementsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
`;

interface AccountAnnouncementProps {
    account?: Account;
}

export const AccountAnnouncement = ({ account }: AccountAnnouncementProps) => {
    const notifications = [];

    if (!account) {
        return null;
    }

    if (account.networkType === 'ripple') {
        const bigBalance = new Bignumber(account.balance);
        const bigReserve = new Bignumber(account.misc.reserve);

        if (bigBalance.isLessThan(bigReserve)) {
            notifications.push(<XRPReserve key="xrp" reserve={account.misc.reserve} />);
        }
    }

    if (account.imported) {
        notifications.push(<AccountImported key="imported" />);
    }

    if (notifications.length === 0) {
        return null;
    }

    return <AnnouncementsWrapper>{notifications}</AnnouncementsWrapper>;
};
