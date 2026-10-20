// Trimmed from https://github.com/everstake/wallet-sdk/blob/main/ethereum/src/abi.ts to the
// functions Suite calls. One function per entry so each can be encoded and verified on its own.
export const EVERSTAKE_ABI = {
    stake: [
        {
            type: 'function',
            name: 'stake',
            stateMutability: 'payable',
            inputs: [{ name: 'source', type: 'uint64' }],
            outputs: [],
        },
    ],
    unstake: [
        {
            type: 'function',
            name: 'unstake',
            stateMutability: 'nonpayable',
            inputs: [
                { name: 'value', type: 'uint256' },
                { name: 'allowedInterchangeNum', type: 'uint16' },
                { name: 'source', type: 'uint64' },
            ],
            outputs: [{ name: 'unstakeFromPendingValue', type: 'uint256' }],
        },
    ],
    claimWithdrawRequest: [
        {
            type: 'function',
            name: 'claimWithdrawRequest',
            stateMutability: 'nonpayable',
            inputs: [],
            outputs: [],
        },
    ],
    pendingBalanceOf: [
        {
            type: 'function',
            name: 'pendingBalanceOf',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
        },
    ],
    pendingDepositedBalanceOf: [
        {
            type: 'function',
            name: 'pendingDepositedBalanceOf',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
        },
    ],
    depositedBalanceOf: [
        {
            type: 'function',
            name: 'depositedBalanceOf',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
        },
    ],
    withdrawRequest: [
        {
            type: 'function',
            name: 'withdrawRequest',
            stateMutability: 'view',
            inputs: [{ name: 'staker', type: 'address' }],
            outputs: [
                { name: '', type: 'uint256' },
                { name: '', type: 'uint256' },
            ],
        },
    ],
    restakedRewardOf: [
        {
            type: 'function',
            name: 'restakedRewardOf',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
        },
    ],
    autocompoundBalanceOf: [
        {
            type: 'function',
            name: 'autocompoundBalanceOf',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: 'autocompoundBalance', type: 'uint256' }],
        },
    ],
} as const;

export type EverstakeFunctionName = keyof typeof EVERSTAKE_ABI;
