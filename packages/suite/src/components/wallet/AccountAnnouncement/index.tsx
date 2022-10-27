import * as React from 'react';
import styled from 'styled-components';
import Bignumber from 'bignumber.js';
import { AppState } from '@suite-types';

import XRPReserve from './XRPReserve';
import AccountImported from './AccountImported';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

const AnnouncementsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
`;

export const AccountAnnouncement = (props: Props) => {
    const { account } = props.selectedAccount;
    const notifications = [];

    if (account) {
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
    }

    if (notifications.length === 0) return null;
    return <AnnouncementsWrapper>{notifications}</AnnouncementsWrapper>;
};
