/* @flow */
'use strict';


export const getAccounts = (accounts: Array<any>, device: any, coin: ?string): Array<any> => {
    if (coin) {
        return accounts.filter((addr) => addr.checksum === device.checksum && addr.coin === coin);
    } else {
        return accounts.filter((addr) => addr.checksum === device.checksum);
    }
    
}