import { Calldata } from '@suite-common/calldata';

export type EvmTransactionPurpose =
    | 'transfer'
    | 'approve'
    | 'revoke'
    | 'unknown'
    | 'deposit'
    | 'withdraw'
    | 'redeem'
    | 'claim'
    | 'wrap'
    | 'unwrap'
    | '';

/** What an EVM transaction does, read from its calldata alone. */
export const getEvmTransactionTextSignature = (data?: string): EvmTransactionPurpose => {
    if (!data) return '';

    if (Calldata.evm.erc20.transfer.decode(data)) return 'transfer';

    const approve = Calldata.evm.erc20.approve.decode(data);
    if (approve) return approve.amount === 0n ? 'revoke' : 'approve';

    if (Calldata.evm.erc4626.deposit.decode(data)) return 'deposit';
    if (Calldata.evm.erc4626.withdraw.decode(data)) return 'withdraw';
    if (Calldata.evm.erc4626.redeem.decode(data)) return 'redeem';

    if (Calldata.evm.distributor.claim.decode(data)) return 'claim';

    return 'unknown';
};

export type EvmApprovalPurpose = Extract<EvmTransactionPurpose, 'approve' | 'revoke'>;

export const isEvmApprovalTxByTextSignature = (
    textSignature?: EvmTransactionPurpose,
): textSignature is EvmApprovalPurpose => textSignature === 'approve' || textSignature === 'revoke';

export const isEvmYieldTxByTextSignature = (textSignature?: EvmTransactionPurpose) =>
    textSignature === 'deposit' || textSignature === 'withdraw' || textSignature === 'redeem';
