/* @flow */
import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { online } = props.wallet;
    if (online) return null;
    return (<Notification key="wallet-offline" type="error" title="Wallet is offline" />);
};