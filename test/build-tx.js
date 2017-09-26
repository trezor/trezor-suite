/* global it:false, describe:false */

import assert from 'assert';
import {buildTx} from '../lib/build-tx';

import bitcoin from 'bitcoinjs-lib-zcash';

describe('build tx', () => {
    it('builds a simple tx with 1 output, no change', () => {
        const utxos = [{
            index: 0,
            transactionHash: 'fba6cbdccc01b85901f0372e1b0105586b2b503218f5aee432d2166fbeb6e35f',
            value: 102001,
            addressPath: [0, 0],
            height: 100,
            coinbase: false,
            tsize: 0,
            vsize: 0,
            fee: 0,
            own: true,
        }];
        const outputs = [{
            type: 'complete',
            address: '1BitcoinEaterAddressDontSendf59kuE',
            amount: 100000,
        }];
        const height = 100;
        const feeRate = 10;
        const segwit = false;
        const inputAmounts = false;
        const basePath = [0, 0];
        const network = bitcoin.networks.bitcoin;
        const changeId = 0;
        const changeAddress = '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT';

        const res = buildTx(utxos, outputs, height, feeRate, segwit, inputAmounts, basePath, network, changeId, changeAddress);
        assert(res.type === 'final');
        assert(res.totalSpent === 100000);
        assert(res.fee === 2001);
        assert(res.feePerByte === 10);
        assert(res.bytes === 1);
    });
});
