import * as NETWORKS from '../src/networks';
import { getTransactionVbytesFromAddresses } from '../src/vsize';

describe('vsize', () => {
    // Spec: a legacy (non-segwit) transaction with 1 P2PKH input and 1 P2PKH output
    // has a stripped size of 192 bytes when the input scriptSig is 108 bytes
    // (1 + 72 DER sig + 1 + 33 compressed pubkey) and the P2PKH output script is
    // 25 bytes (OP_DUP OP_HASH160 <20> OP_EQUALVERIFY OP_CHECKSIG).
    //
    // Weight: TX_BASE(32) + varInt(1)*4 + inputWeight(160 + 4*108=592) +
    //         varInt(1)*4 + outputWeight(4*(8+1+25)=136) = 768
    // vbytes = ceil(768 / 4) = 192
    it('computes the vbytes of a 1-input/1-output P2PKH legacy transaction (192 vbytes)', () => {
        const vbytes = getTransactionVbytesFromAddresses(
            ['1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT'],
            ['1BitcoinEaterAddressDontSendf59kuE'],
            NETWORKS.bitcoin,
        );
        expect(vbytes).toBe(192);
    });
});
