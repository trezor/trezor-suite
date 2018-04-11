/* @flow */
'use strict';

import RouterService from './RouterService';
import LocalStorageService from './LocalStorageService';
import CoinmarketcapService from './CoinmarketcapService';
import TrezorConnectService from './TrezorConnectService';

export default [
    RouterService,
    LocalStorageService,
    TrezorConnectService,
    CoinmarketcapService,
];