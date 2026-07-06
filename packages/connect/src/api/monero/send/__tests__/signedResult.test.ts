import { type DeviceSignedTransaction, toSignedTransactionResult } from '../signedResult';

const device: DeviceSignedTransaction = {
    signatures: ['aa'],
    rv: { rv_type: 6, txn_fee: 10_000 },
    pseudo_outs: ['bb'],
    out_pks: ['cc', 'dd'],
    ecdh_infos: ['ee', 'ff'],
    tx_outs: ['11', '22'],
    rsig_parts: ['33'],
    extra: '44',
};

describe('toSignedTransactionResult', () => {
    it('narrows the device result to the assembler subset, preserving the RingCT base', () => {
        expect(toSignedTransactionResult(device)).toEqual({
            signatures: ['aa'],
            rv: { rv_type: 6, txn_fee: 10_000 },
            pseudo_outs: ['bb'],
            out_pks: ['cc', 'dd'],
            ecdh_infos: ['ee', 'ff'],
            tx_outs: ['11', '22'],
            rsig_parts: ['33'],
            extra: '44',
        });
    });

    it('passes through a missing extra and partial rv', () => {
        const result = toSignedTransactionResult({ ...device, extra: undefined, rv: {} });
        expect(result.extra).toBeUndefined();
        expect(result.rv).toEqual({ rv_type: undefined, txn_fee: undefined });
    });
});
