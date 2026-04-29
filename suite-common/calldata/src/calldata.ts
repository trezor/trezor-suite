import { buildAllowance } from './builder/evm/allowance';
import { buildApprove } from './builder/evm/approve';
import { buildClaim } from './builder/evm/claim';
import { buildDeposit } from './builder/evm/deposit';
import { buildRedeem } from './builder/evm/redeem';
import { buildTransfer } from './builder/evm/transfer';
import { buildWithdraw } from './builder/evm/withdraw';
import { buildTrc20Transfer } from './builder/tron/trc20/transfer';

export const Calldata = {
    evm: {
        erc20: {
            allowance: buildAllowance,
            approve: buildApprove,
            transfer: buildTransfer,
        },
        erc4626: {
            deposit: buildDeposit,
            withdraw: buildWithdraw,
            redeem: buildRedeem,
        },
        distributor: {
            claim: buildClaim,
        },
    },
    tron: {
        trc20: {
            transfer: buildTrc20Transfer,
        },
    },
} as const;
