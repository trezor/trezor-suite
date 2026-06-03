import { Calldata } from '@suite-common/calldata';
import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';

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
export const getMatchAddress = <Tx extends UnsignedYieldTx>(unsignedTx: Tx): string | undefined => {
    switch (getEvmTransactionTextSignature(unsignedTx.data)) {
        case 'deposit':
        case 'withdraw':
        case 'redeem':
            return unsignedTx.to;

        case 'approve':
        case 'revoke': {
            return Calldata.evm.erc20.approve.decode(unsignedTx.data)?.spender;
        }
        default:
            return undefined;
    }
};
