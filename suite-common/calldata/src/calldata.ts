import { buildApprove } from './builder/evm/approve';
import { buildDeposit } from './builder/evm/deposit';
import { buildRedeem } from './builder/evm/redeem';
import { buildTransfer } from './builder/evm/transfer';
import { buildWithdraw } from './builder/evm/withdraw';

export const Calldata = {
    evm: {
        erc20: {
            approve: buildApprove,
            transfer: buildTransfer,
        },
        erc4626: {
            deposit: buildDeposit,
            withdraw: buildWithdraw,
            redeem: buildRedeem,
        },
    },
} as const;
