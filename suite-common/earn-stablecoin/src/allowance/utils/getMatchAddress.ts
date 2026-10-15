import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';
import { type Calldata } from '@trezor/calldata';

type UnsignedYieldTx = {
    to?: string;
    data?: string;
};

/**
 * Returns the on-chain address that identifies the vault for a given transaction:
 * - for deposit/withdraw/redeem the vault is the call target (`tx.to`);
 * - for approve/revoke the vault is the ERC20 `spender` decoded from the calldata
 *   (the call target is the token contract, not the vault).
 */
export const getMatchAddress = <Tx extends UnsignedYieldTx>(
    networkCalldata: Calldata | undefined,
    unsignedTx: Tx,
): string | undefined => {
    switch (getEvmTransactionTextSignature(networkCalldata, unsignedTx.data)) {
        case 'deposit':
        case 'withdraw':
        case 'redeem':
            return unsignedTx.to;

        case 'approve':
        case 'revoke': {
            return (networkCalldata?.evm?.erc20.approve.decode(unsignedTx.data) ?? null)?.spender;
        }
        default:
            return undefined;
    }
};
