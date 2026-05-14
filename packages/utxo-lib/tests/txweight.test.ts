import { TxWeightCalculator } from '../src/txWeightCalculator';

// fixtures from:
// https://github.com/trezor/trezor-firmware/blob/1fceca73da523c5bf2bb0f398c91e00c728bdbe0/core/tests/test_apps.bitcoin.txweight.py

describe('TxWeightCalculator', () => {
    it('p2pkh', () => {
        const c = new TxWeightCalculator();
        c.addInput({ script_type: 'SPENDADDRESS' });
        c.addOutputByKey('p2pkh');

        const serialized =
            '010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006b4830450221009a0b7be0d4ed3146ee262b42202841834698bb3ee39c24e7437df208b8b7077102202b79ab1e7736219387dffe8d615bbdba87e11477104b867ef47afed1a5ede7810121023230848585885f63803a0a8aecdd6538792d5c539215c91698e315bf0253b43dffffffff0160cc0500000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000';

        expect(c.getTotal()).toEqual((serialized.length / 2) * 4);
    });

    it('p2wpkh in p2sh', () => {
        const c = new TxWeightCalculator();
        c.addInput({ script_type: 'SPENDP2SHWITNESS' });
        c.addOutputByKey('p2pkh');
        c.addOutputByKey('p2sh');
        expect(c.getTotal()).toEqual(670);
    });

    it('native p2wpkh', () => {
        const c = new TxWeightCalculator();
        c.addInput({ script_type: 'SPENDWITNESS' });
        c.addOutputByKey('p2sh');
        c.addOutputByKey('p2wpkh');
        expect(c.getTotal()).toEqual(566);
    });

    it('taproot p2tr', () => {
        const c = new TxWeightCalculator();
        c.addInput({ script_type: 'SPENDTAPROOT' });
        c.addOutputByKey('p2tr');
        expect(c.getTotal()).toEqual(4 * 94 + 68);
    });

    it('EXTERNAL input without ownership_proof contributes 4*1 weight units (empty script_sig varint, zero witness) per upstream tx_weight_calculator', () => {
        const c = new TxWeightCalculator();
        c.addInput({ script_type: 'EXTERNAL' });
        c.addOutputByKey('p2pkh');
        expect(c.getTotal()).toEqual(340);
    });

    it('throws "unknown input script_type" for unrecognized script_type', () => {
        const c = new TxWeightCalculator();
        expect(() => c.addInput({ script_type: 'INVALID' })).toThrow('unknown input script_type');
    });

    it('throws "Multisig not supported for Taproot yet" when SPENDTAPROOT is combined with multisig', () => {
        const c = new TxWeightCalculator();
        expect(() =>
            c.addInput({
                script_type: 'SPENDTAPROOT',
                multisig: { pubkeys: [{}, {}], m: 1 },
            }),
        ).toThrow('Multisig not supported for Taproot yet');
    });

    it('legacy 2-of-3 multisig (SPENDMULTISIG) matches upstream fixture 4*341', () => {
        const c = new TxWeightCalculator();
        c.addInput({
            script_type: 'SPENDMULTISIG',
            multisig: {
                pubkeys: [{}, {}, {}],
                m: 2,
            },
        });
        c.addOutputByKey('p2pkh');
        expect(c.getTotal()).toEqual(4 * 341);
    });

    it('legacy 1-of-2 multisig with .nodes uses nodes.length for n and exercises the OP push <76 size arm', () => {
        const c = new TxWeightCalculator();
        c.addInput({
            script_type: 'SPENDMULTISIG',
            multisig: {
                nodes: [{}, {}],
                pubkeys: [{}],
                m: 1,
            },
        });
        c.addOutputByKey('p2pkh');
        expect(c.getTotal()).toEqual(924);
    });

    // eslint-disable-next-line jest/no-commented-out-tests
    // it('segwit multisig', () => {
    //     const c = new TxWeightCalculator();
    //     c.addInput({
    //         script_type: 'SPENDP2SHWITNESS',
    //         multisig: {
    //             pubkeys: [{}, {}, {}],
    //             m: 2,
    //         },
    //     });
    //     c.addOutputByKey('p2wpkh');
    //     expect(c.getTotal()).toEqual(4 * 129 + 256);
    // });
});
