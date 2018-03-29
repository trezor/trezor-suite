/* @flow */
'use strict';


export const getAccounts = (accounts: Array<any>, device: any, network: ?string): Array<any> => {
    if (network) {
        return accounts.filter((addr) => addr.deviceState === device.state && addr.network === network);
    } else {
        return accounts.filter((addr) => addr.deviceState === device.state);
    }
    
}