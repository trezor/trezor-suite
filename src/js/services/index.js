/* @flow */
'use strict';

import RouterService from './RouterService';
import LocalStorageService from './LocalStorageService';
import CoinmarketcapService from './CoinmarketcapService';
import TrezorConnectService from './TrezorConnectService';
import Web3Service from './Web3Service';
import EtherscanService from './EtherscanService';

export default [
    RouterService,
    LocalStorageService,
    TrezorConnectService,
    Web3Service,
    CoinmarketcapService,
    //EtherscanService,
];