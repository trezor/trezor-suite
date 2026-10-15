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
    ens: {
        // ENSIP-19 UniversalResolver.
        resolve: parseAbi([
            'function resolve(bytes name, bytes data) view returns (bytes result, address resolver)',
        ]),
        reverse: parseAbi([
            'function reverse(bytes lookupAddress, uint256 coinType) view returns (string primary, address resolver, address reverseResolver)',
        ]),
        // Resolver profiles, wrapped in `resolve` above rather than called directly.
        addr: parseAbi(['function addr(bytes32 node) view returns (address)']),
        text: parseAbi(['function text(bytes32 node, string key) view returns (string)']),
        // Optional for a resolver: batches several profiles into one `resolve`.
        multicall: parseAbi(['function multicall(bytes[] data) returns (bytes[] results)']),
    },
    weth: {
        deposit: parseAbi(['function deposit() payable']),
        withdraw: parseAbi(['function withdraw(uint256 wad)']),
    },
} as const;
