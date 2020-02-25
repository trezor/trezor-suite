import React from 'react';
import * as accountUtils from '@wallet-utils/accountUtils';
// import * as deviceUtils from '@suite-utils/device';
import { Props } from './Container';
import AccountLabel from '../Account/Container';

// DeviceLabel? / WalletLabel? / Account #N / AccountType?

export default (props: Props) => {
    const { address } = props;
    if (!address) return null;

    if (props.labeling[address]) {
        // address found in labeling
        return <>{props.labeling[address]}</>;
    }

    const found = accountUtils.findAccountsByAddress(address, props.accounts);
    if (found.length < 1) return !props.knownOnly ? <>{address}</> : null;

    return <AccountLabel account={found[0]} />;

    // const values: Values = {};
    // let accountDevice: TrezorDevice | undefined;
    // if (!device || !found.find(a => a.deviceState === device.state)) {
    //     // account is not associated with selected device, add wallet label
    //     accountDevice = accountUtils.getAccountDevice(props.devices, found[0]);
    //     if (accountDevice) {
    //         values.walletLabel = <WalletLabel device={accountDevice} useDeviceLabel={!deviceUtils.isSelectedInstance(device, accountDevice)} />
    //     }
    // }

    // values.accountLabel = <AccountLabel account={found[0]} />;

    // // this network has legacy also accounts, account type suffix needed
    // const siblings = accountUtils.getLegacySiblings(found[0], props.accounts);
    // if (siblings.length > 0 && found[0].accountType !== 'normal') {
    //     values.accountType = found[0].accountType;
    // }

    // return accountUtils.getAccountLabel(found[0], accountDevice, siblings.length > 0);
};
