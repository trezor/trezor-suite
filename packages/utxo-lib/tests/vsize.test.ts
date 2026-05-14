import * as NETWORKS from '../src/networks';
import { getTransactionVbytes, getTransactionVbytesFromAddresses } from '../src/vsize';

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

    // Exercises the OP_RETURN <hex> branch in toVout: BitcoinJsAddress.toOutputScript
    // throws for the non-address string, the catch block matches /^OP_RETURN (.*)$/,
    // and since the captured group "deadbeef" has no surrounding parens the hex
    // branch fires: scriptLen = 2 + msg.length / 2 = 2 + 8/2 = 6
    // (1 byte OP_RETURN + 1 byte push opcode + 4 bytes data).
    //
    // Weight: TX_BASE(32) + varInt(1)*4 + inputWeight(160 + 4*108=592) +
    //         varInt(1)*4 + outputWeight(4*(8+1+6)=60) = 692
    // vbytes = ceil(692 / 4) = 173
    it('computes vbytes for an OP_RETURN <hex> output (hex branch in toVout)', () => {
        const vbytes = getTransactionVbytesFromAddresses(
            ['1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT'],
            ['OP_RETURN deadbeef'],
            NETWORKS.bitcoin,
        );
        expect(vbytes).toBe(173);
    });

    // Exercises the OP_RETURN ascii branch in toVout: BitcoinJsAddress.toOutputScript
    // throws, the catch block captures msg = "(hello)", and the parens-anchored
    // regex /^\(.*\)$/ matches, so scriptLen = msg.length = 7 (the parens cancel
    // out the 2-byte OP_RETURN+push overhead — that's the per-package convention).
    //
    // Weight: TX_BASE(32) + varInt(1)*4 + inputWeight(160 + 4*108=592) +
    //         varInt(1)*4 + outputWeight(4*(8+1+7)=64) = 696
    // vbytes = ceil(696 / 4) = 174
    it('computes vbytes for an OP_RETURN (ascii) output (ascii branch in toVout)', () => {
        const vbytes = getTransactionVbytesFromAddresses(
            ['1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT'],
            ['OP_RETURN (hello)'],
            NETWORKS.bitcoin,
        );
        expect(vbytes).toBe(174);
    });

    // Exercises the "unknown output address" fallthrough in toVout: the address
    // fails BitcoinJsAddress.toOutputScript (throws "has no matching Script"),
    // and the OP_RETURN regex /^OP_RETURN (.*)$/ does not match either (no
    // "OP_RETURN " prefix), so the else branch sets length = 0.
    //
    // Weight: TX_BASE(32) + varInt(1)*4 + inputWeight(160 + 4*108=592) +
    //         varInt(1)*4 + outputWeight(4*(8+1+0)=36) = 668
    // vbytes = ceil(668 / 4) = 167
    it('treats an unrecognised output as zero-length (unknown branch in toVout)', () => {
        const vbytes = getTransactionVbytesFromAddresses(
            ['1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT'],
            ['not_an_address'],
            NETWORKS.bitcoin,
        );
        expect(vbytes).toBe(167);
    });

    // Exercises the false branch of isKnownInputAddress in toVin: getAddressType
    // returns 'unknown' for any string that fails decodeAddress, so the type-guard
    // returns false and toVin throws "Unknown input address '<addr>'". This is the
    // only branch in toVin that surfaces to consumers — wallet code relies on it
    // to fail loudly rather than silently producing a zero-weight input.
    it('throws Unknown input address when the input cannot be classified', () => {
        expect(() =>
            getTransactionVbytesFromAddresses(
                ['not_an_address'],
                ['1BitcoinEaterAddressDontSendf59kuE'],
                NETWORKS.bitcoin,
            ),
        ).toThrow("Unknown input address 'not_an_address'");
    });

    // Exercises the Blockbook-style wrapper getTransactionVbytes: when a vin/vout
    // entry has no `addresses` key the destructuring default `= []` kicks in, and
    // when the array is empty `addresses[0]` is undefined so `?? ''` falls back
    // to the empty string. With ins=[''] the inner toVin then throws
    // "Unknown input address ''" — proving both the default-arg and the
    // nullish-coalescing fallback fired on both vin AND vout maps before the
    // throw bubbled out of getTransactionVbytesFromAddresses.
    it('defaults missing addresses to empty array and empty string in getTransactionVbytes wrapper', () => {
        expect(() => getTransactionVbytes({ vin: [{}], vout: [{}] }, NETWORKS.bitcoin)).toThrow(
            "Unknown input address ''",
        );
    });
});
