import { Calldata } from '@suite-common/calldata';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';

type UnsignedYieldTx = {
    to?: string | null;
    data?: string;
};

/**
 * Returns the on-chain address that identifies the vault for a given transaction:
 * - for deposit/withdraw/redeem the vault is the call target (`tx.to`);
 * - for approve/revoke the vault is the ERC20 `spender` decoded from the calldata
 *   (the call target is the token contract, not the vault).
 */
const getMatchAddress = <Tx extends UnsignedYieldTx>(unsignedTx: Tx): string | undefined => {
    const signature = getEvmTransactionTextSignature(unsignedTx.data);

    switch (signature) {
        case 'approve':
        case 'revoke':
            return Calldata.evm.erc20.approve.decode(unsignedTx.data)?.spender;
        case 'deposit':
        case 'withdraw':
        case 'redeem':
            return unsignedTx.to ?? undefined;
        default:
            return undefined;
    }
};

/**
 * Resolves the yield vault a transaction interacts with by matching the
 * transaction's vault address against the vault registry returned by the API.
 * The caller reads the canonical name from `vault.metadata.name`.
 */
export const getYieldVaultFromTx = <Tx extends UnsignedYieldTx>(
    unsignedTx: Tx,
    vaults: YieldDto[],
): YieldDto | undefined => {
    const matchAddress = getMatchAddress(unsignedTx);

    if (!matchAddress) {
        return undefined;
    }

    return vaults.find(
        vault => getYieldVaultContractAddress(vault)?.toLowerCase() === matchAddress.toLowerCase(),
    );
};
