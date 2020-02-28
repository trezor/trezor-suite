import * as React from 'react';
import Bignumber from 'bignumber.js';
import { AppState } from '@suite-types';

import LTCAddresses from './LTCAddresses';
import BCHAddresses from './BCHAddresses';
import XRPReserve from './XRPReserve';
import AccountImported from './AccountImported';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

const Announcement = (props: Props) => {
    const { account } = props.selectedAccount;
    const notifications = [];

    if (account) {
        if (account.networkType === 'ripple') {
            const bigBalance = new Bignumber(account.availableBalance);
            const bigReserve = new Bignumber(account.misc.reserve);
            if (bigBalance.isLessThan(bigReserve)) {
                notifications.push(<XRPReserve key="xrp" reserve={account.misc.reserve} />);
            }
        }
        if (account.symbol === 'ltc') {
            notifications.push(<LTCAddresses key="ltc" />);
        }
        if (account.symbol === 'bch') {
            notifications.push(<BCHAddresses key="bch" />);
        }
        if (account.imported) {
            notifications.push(<AccountImported key="imported" />);
        }
    }

    return <>{notifications}</>;
};

export default Announcement;
