import { type Branded } from '@trezor/type-utils';
import { type BigNumber } from '@trezor/utils';

import { type Builder } from './builder';

export type CalldataHex = `0x${string}`;
export type EvmAddress = CalldataHex & Branded<'EvmAddress'>;
export type TronAddress = string & Branded<'TronAddress'>;

type EvmContext = { sender: EvmAddress; balance?: bigint };
type AddressContext = { sender?: EvmAddress; addressWhitelist?: EvmAddress[] };
type Encoder<TInput extends Record<string, unknown>, TContext = Record<string, unknown>> = Builder<
    TInput,
    TContext,
    CalldataHex
>;
type Decoder<TOutput> = (data?: string) => TOutput | null;
type Decodable<TInput extends Record<string, unknown>, TDecoded, TContext = EvmContext> = {
    encode: Encoder<TInput, TContext>;
    decode: Decoder<TDecoded>;
};

export type VerifyIssue = {
    code: 'DECODING_FAILED' | 'SIGNATURE_MISMATCH' | 'VALUE_MISMATCH';
    field: string | null;
};
export type VerifyResult = { isValid: boolean; issues: VerifyIssue[] };
type Verify<TExpected> = (
    data: CalldataHex,
    expected: TExpected,
    fields?: (keyof TExpected & string)[],
) => VerifyResult;

type Approve = { spender: CalldataHex; amount: bigint };
type Allowance = { owner: CalldataHex; spender: CalldataHex };
type Transfer = { to: CalldataHex; amount: bigint };
type Deposit = { assets: bigint; receiver: CalldataHex };
type Withdraw = { assets: bigint; receiver: CalldataHex; owner: CalldataHex };
type Redeem = { shares: bigint; receiver: CalldataHex; owner: CalldataHex };
type Claim = {
    users: readonly CalldataHex[];
    tokens: readonly CalldataHex[];
    amounts: readonly bigint[];
    proofs: readonly (readonly CalldataHex[])[];
};
type Stake = { source: bigint };
type Unstake = { value: bigint; allowedInterchangeNum: number; source: bigint };
type Empty = Record<never, never>;

type EvmMethods = {
    erc20: {
        allowance: { encode: Encoder<{ owner: string; spender: string }, AddressContext> };
        approve: Decodable<{ spender: string; amount: BigNumber }, Approve>;
        transfer: Decodable<{ to: string; amount: BigNumber }, Transfer>;
    };
    erc4626: {
        deposit: Decodable<{ assets: BigNumber; receiver: string }, Deposit>;
        withdraw: Decodable<{ assets: BigNumber; receiver: string; owner: string }, Withdraw>;
        redeem: Decodable<{ shares: BigNumber; receiver: string; owner: string }, Redeem>;
    };
    distributor: {
        claim: Decodable<
            {
                users: string[];
                tokens: string[];
                amounts: BigNumber[];
                proofs: string[][];
            },
            Claim
        >;
    };
    everstake: {
        stake: { encode: Encoder<{ source: BigNumber }> };
        unstake: Decodable<
            {
                value: BigNumber;
                allowedInterchangeNum: BigNumber;
                source: BigNumber;
            },
            Unstake,
            Record<string, unknown>
        >;
        claimWithdrawRequest: { encode: Encoder<Empty> };
    };
    ens: {
        resolve: { encode: Encoder<{ name: string; data: string }> };
        reverse: { encode: Encoder<{ lookupAddress: string; coinType: BigNumber }> };
        addr: { encode: Encoder<{ node: string }> };
        text: { encode: Encoder<{ node: string; key: string }> };
        multicall: { encode: Encoder<{ data: string[] }> };
    };
    weth: {
        deposit: Decodable<Empty, Empty, Record<string, unknown>>;
        withdraw: Decodable<{ wad: BigNumber }, { wad: bigint }, { balance?: bigint }>;
    };
};

type EvmVerifier = {
    evm: {
        erc20: { allowance: Verify<Allowance>; approve: Verify<Approve> };
        erc4626: { deposit: Verify<Deposit>; withdraw: Verify<Withdraw>; redeem: Verify<Redeem> };
        distributor: { claim: Verify<Claim> };
        everstake: {
            stake: Verify<Stake>;
            unstake: Verify<Unstake>;
            claimWithdrawRequest: Verify<Empty>;
        };
        weth: { deposit: Verify<Empty>; withdraw: Verify<{ wad: bigint }> };
    };
};

type UnstakeAbi = readonly [
    {
        readonly type: 'function';
        readonly name: 'unstake';
        readonly stateMutability: 'nonpayable';
        readonly inputs: readonly [
            { readonly name: 'value'; readonly type: 'uint256' },
            { readonly name: 'allowedInterchangeNum'; readonly type: 'uint16' },
            { readonly name: 'source'; readonly type: 'uint64' },
        ];
        readonly outputs: readonly [
            { readonly name: 'unstakeFromPendingValue'; readonly type: 'uint256' },
        ];
    },
];

export type ClearSigningCoverage = 'full' | 'partial';
export type ClearSignedSwapLeg = { amount: bigint; token: string };
export type DecodedClearSignedSwap = { send: ClearSignedSwapLeg; receive?: ClearSignedSwapLeg };

/** The Ethereum API keeps its existing protocol groups and separate verifier. */
export type EvmCalldata = {
    evm: EvmMethods;
    tron?: never;
    Verifier: EvmVerifier;
    EVM_ABI: { everstake: { unstake: UnstakeAbi } };
    asEvmAddress: (address: string) => EvmAddress;
    isEvmClearSigningTx: (chainId: number, to: string | null | undefined, data?: string) => boolean;
    getEvmClearSignedSwapCoverage: (
        chainId: number,
        to: string | null | undefined,
        data: string | undefined,
        firmwareVersion: string,
    ) => ClearSigningCoverage | undefined;
    decodeClearSignedSwap: (data?: string, value?: bigint) => DecodedClearSignedSwap | null;
};

export type TronCalldata = {
    evm?: never;
    tron: {
        trc20: {
            transfer: {
                encode: Encoder<{ to: string; amount: BigNumber }, { sender?: TronAddress }>;
            };
        };
    };
};

export type Calldata = EvmCalldata | TronCalldata;
export type CalldataDep = { calldata: Calldata };
