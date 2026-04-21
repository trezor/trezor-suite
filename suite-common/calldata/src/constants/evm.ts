import { parseAbi } from 'viem';

export const EVM_ABI = {
    erc20: {
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
} as const;
