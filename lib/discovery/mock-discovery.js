/* @flow */

import type {
    AccountInfo,
    AccountLoadStatus,
} from './index';
import { Stream, StreamWithEnding } from '../utils/stream';
import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';

const mockAccountInfo: AccountInfo = {
    utxos: [],
    transactions: [],
    usedAddresses: [{
        address: '1BitcoinEaterAddressDontSendf59kuE',
        received: 1000,
    }],
    unusedAddresses: [
        '1BitcoinEaterAddressDontSendf59kuE',
        '1BitcoinEsterAddressDontSendf59kuE',
    ],
    changeIndex: 0,
    balance: 0,
    sentAddresses: {},
    lastBlock: {height: 0, hash: 'abc'},
    transactionHashes: {},
    changeAddresses: [],
    allowChange: false,
};

export class MockDiscovery {
    discoverAccount(
        initial: ?AccountInfo,
        // source: Array<AddressSource>
        xpub: string,
        network: BitcoinJsNetwork
    ): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        return StreamWithEnding.fromController((update, finish) => {
            setTimeout(() => finish(mockAccountInfo), 10000);
            return () => {};
        });
    }

    monitorAccountActivity(
        initial: AccountInfo,
        // source: Array<AddressSource>
        xpub: string,
        network: BitcoinJsNetwork
    ): Stream<AccountInfo | Error> {
        return new Stream((update, finish) => {
            return () => {};
        });
    }
}
