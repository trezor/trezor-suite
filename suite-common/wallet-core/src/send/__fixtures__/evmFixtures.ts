import {
    type AccountWithNetworkType,
    type FeeInfo,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

export type EthAccount = AccountWithNetworkType<'ethereum'>;

export const ethAccount = mockWalletAccount({ symbol: 'eth' }) as EthAccount;

type EvmGas = {
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
};

export const FOREIGN_SIGNER = '0x0F6666bC699aec39b846E898473e9CAec5a6b821';
type EvmTxParams = {
    confirmed?: boolean;
    type?: WalletAccountTransaction['type'];
    gas?: EvmGas;
    signer?: string;
};

/**
 * Minimal EVM `WalletAccountTransaction` for nonce/fee unit tests. Only the fields the code under
 * test reads (`type`, `blockHeight` -> isPending, `ethereumSpecific`, and `details.vin` ->
 * isSignedByAccount) are meaningful. `signer` defaults to the account itself; pass a foreign address
 * for a transaction that merely names the account, which must not count toward its nonces.
 */
export const evmTx = (
    nonce: number,
    { confirmed = true, type = 'sent', gas, signer = ethAccount.descriptor }: EvmTxParams = {},
): WalletAccountTransaction =>
    ({
        type,
        txid: `0x${nonce}`,
        blockHeight: confirmed ? 100 : 0,
        descriptor: ethAccount.descriptor,
        details: {
            vin: [
                {
                    n: 0,
                    isAddress: true,
                    addresses: [signer],
                    isAccountOwned: signer === ethAccount.descriptor || undefined,
                },
            ],
            vout: [],
        },
        ethereumSpecific: {
            status: confirmed ? 1 : -1,
            nonce,
            gasLimit: 21000,
            gasUsed: confirmed ? 21000 : undefined,
            gasPrice: gas?.gasPrice ?? '0',
            maxFeePerGas: gas?.maxFeePerGas,
            maxPriorityFeePerGas: gas?.maxPriorityFeePerGas,
        },
    }) as unknown as WalletAccountTransaction;

/** Confirmed outgoing EVM txs occupying nonces `0..count-1`. */
export const confirmedNonces = (count: number): WalletAccountTransaction[] =>
    Array.from({ length: count }, (_, i) => evmTx(i, { confirmed: true }));

const ethLevel = (overrides: Partial<FeeInfo['levels'][number]>): FeeInfo['levels'][number] =>
    ({
        label: 'normal',
        feePerUnit: '20',
        feeLimit: '21000',
        blocks: 1,
        ...overrides,
    }) as FeeInfo['levels'][number];

// Fee levels are expressed in Gwei (as getEthereumRbfFeeInfo expects).
export const feeInfoEip1559: FeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    levels: [
        ethLevel({
            label: 'normal',
            feePerUnit: '20',
            maxFeePerGas: '20',
            maxPriorityFeePerGas: '2',
        }),
        ethLevel({
            label: 'high',
            feePerUnit: '30',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '3',
        }),
    ],
};

export const feeInfoLegacy: FeeInfo = {
    blockHeight: 100,
    blockTime: 12,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 0,
    levels: [ethLevel({ label: 'normal', feePerUnit: '20' })],
};
