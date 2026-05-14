import { parseAbi } from 'viem';

export const EVM_ABI = {
    erc20: {
        allowance: parseAbi([
            'function allowance(address owner, address spender) returns (uint256)',
        ]),
        approve: parseAbi(['function approve(address spender, uint256 amount)']),
        transfer: parseAbi(['function transfer(address to, uint256 amount)']),
    },
    erc4626: {
        deposit: parseAbi(['function deposit(uint256 assets, address receiver)']),
        withdraw: parseAbi(['function withdraw(uint256 assets, address receiver, address owner)']),
        redeem: parseAbi(['function redeem(uint256 shares, address receiver, address owner)']),
    },
    distributor: {
        claim: parseAbi([
            'function claim(address[] users, address[] tokens, uint256[] amounts, bytes32[][] proofs)',
        ]),
    },
    everstake: {
        stake: parseAbi(['function stake(uint64 source)']),
        unstake: parseAbi([
            'function unstake(uint256 value, uint16 allowedInterchangeNum, uint64 source) returns (uint256 unstakeFromPendingValue)',
        ]),
        claimWithdrawRequest: parseAbi(['function claimWithdrawRequest()']),
    },
} as const;
