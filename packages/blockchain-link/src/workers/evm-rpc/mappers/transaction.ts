import type { Block, Transaction, TransactionReceipt } from 'viem';

import { RESPONSES } from '@trezor/blockchain-link-types';
import type {
    EnhancedVinVout,
    InternalTransfer,
    ResponseTypes as Responses,
    Target,
    TokenTransfer,
    TransferType,
    Transaction as TransformedTransaction,
} from '@trezor/blockchain-link-types';

import { type NativeLogSource, toNativeAmount } from '../history/nativeAsset';
import { type ParsedTransfer, parseTransferLog } from '../history/transferLog';
import { isSameAddress } from '../utils/address';

export type TokenMetadata = {
    name?: string;
    symbol?: string;
    decimals: number;
    standard: TokenTransfer['standard'];
};

interface MapTransactionParams {
    tx: Transaction;
    receipt: TransactionReceipt;
    block?: Block;
    /** Preferred over `block` when the timestamp is already known, e.g. from a log. */
    blockTime?: number;
    userAddress?: string;
    nativeSources?: readonly NativeLogSource[];
    tokenMetadata?: Map<string, TokenMetadata>;
}

const DEFAULT_TOKEN_DECIMALS = 18;

const getTransactionStatus = (receipt: TransactionReceipt): number => {
    if (receipt.status === 'success') {
        return 1;
    }
    if (receipt.status === 'reverted') {
        return 0;
    }

    return -1;
};

/** Mirrors blockbook: a transfer out of the account reads as 'sent', into it as 'recv'. */
const getTransferType = (transfer: ParsedTransfer, me: string): TransferType => {
    const isFromMe = isSameAddress(transfer.from, me);
    const isToMe = isSameAddress(transfer.to, me);

    if (isFromMe && isToMe) return 'self';
    if (isFromMe) return 'sent';
    if (isToMe) return 'recv';

    return 'unknown';
};

/**
 * Chains that mirror native movements into `Transfer` logs may expose more than one mirror of the
 * same movement. Whichever mirror this transaction used, it used consistently, so the first source
 * with any log wins and the rest are ignored - that keeps a single movement from being counted
 * twice while still working when only the lower-precision mirror is present.
 */
const getNativeMoves = (
    transfers: ParsedTransfer[],
    nativeSources: readonly NativeLogSource[],
): ParsedTransfer[] => {
    for (const source of nativeSources) {
        const address = source.address.toLowerCase();
        const fromSource = transfers.filter(transfer => transfer.contract === address);

        if (fromSource.length) {
            return fromSource.map(transfer => ({
                ...transfer,
                value: toNativeAmount(transfer.value, source.decimals),
            }));
        }
    }

    return [];
};

export const mapTransaction = ({
    tx,
    receipt,
    block,
    blockTime,
    userAddress,
    nativeSources = [],
    tokenMetadata,
}: MapTransactionParams): TransformedTransaction => {
    const { value, gasPrice } = tx;
    const { gasUsed, effectiveGasPrice } = receipt;
    // effectiveGasPrice is the price actually charged and differs from the gasPrice bid on L2s;
    // use it when positive, otherwise fall back to the gasPrice bid (mirrors blockbook).
    const feeGasPrice = effectiveGasPrice > 0n ? effectiveGasPrice : (gasPrice ?? 0n);
    const fee = (gasUsed * feeGasPrice).toString(10);

    const status = getTransactionStatus(receipt);
    const blockHash = tx.blockHash || '';
    const isMined = !!tx.blockNumber;

    const transfers = (receipt.logs ?? [])
        .map(log => parseTransferLog(log))
        .filter((transfer): transfer is ParsedTransfer => !!transfer);

    const nativeAddresses = new Set(nativeSources.map(source => source.address.toLowerCase()));
    const nativeMoves = getNativeMoves(transfers, nativeSources);

    const me = userAddress ?? '';
    const isFromMe = isSameAddress(tx.from, me);
    const isToMe = isSameAddress(tx.to, me);

    const tokens: TokenTransfer[] = transfers
        .filter(transfer => !nativeAddresses.has(transfer.contract))
        .map(transfer => ({ transfer, type: getTransferType(transfer, me) }))
        .filter(({ type }) => type !== 'unknown')
        .map(({ transfer, type }) => {
            const metadata = tokenMetadata?.get(transfer.contract);

            return {
                type,
                standard: metadata?.standard ?? 'ERC20',
                amount: transfer.value.toString(),
                from: transfer.from,
                to: transfer.to,
                contract: transfer.contract,
                name: metadata?.name,
                symbol: metadata?.symbol,
                decimals: metadata?.decimals ?? DEFAULT_TOKEN_DECIMALS,
            } satisfies TokenTransfer;
        });

    // The transaction's own value transfer is already represented by amount and targets; anything
    // else the chain mirrored is an internal transfer, which is how blockbook reports native moves
    // made inside a contract call.
    let topLevelSeen = false;
    const internalTransfers: InternalTransfer[] = nativeMoves
        .filter(move => {
            const isTopLevel =
                !topLevelSeen &&
                isSameAddress(move.from, tx.from) &&
                isSameAddress(move.to, tx.to) &&
                move.value === value;
            topLevelSeen = topLevelSeen || isTopLevel;

            return !isTopLevel;
        })
        .map(move => ({
            type: getTransferType(move, me),
            amount: move.value.toString(),
            from: move.from,
            to: move.to,
        }))
        .filter(({ type }) => type !== 'unknown');

    const target: Target = {
        addresses: tx.to ? [tx.to] : undefined,
        isAddress: true,
        amount: value.toString(),
        n: 0,
    };

    let type: TransformedTransaction['type'] = 'unknown';
    let amount = value.toString();
    let targets: Target[] = tx.to ? [target] : [];

    if (me) {
        const myTransfers = [...tokens, ...internalTransfers];

        if (receipt.contractAddress) {
            type = 'contract';
            targets = [];
        } else if (isFromMe) {
            if (isToMe) {
                // blockbook reports a self-send's amount as what it actually cost: the fee.
                type = 'self';
                amount = fee;
            } else {
                type = 'sent';
                targets = tx.to ? [target] : [];
            }
        } else if (isToMe || myTransfers.length) {
            type = 'recv';
            amount = isToMe ? value.toString() : '0';
            targets = isToMe ? [target] : [];

            if (myTransfers.some(transfer => transfer.type === 'sent')) {
                type = 'sent';
            } else if (!isToMe && myTransfers.some(transfer => transfer.type !== 'recv')) {
                type = 'self';
            }
        } else {
            targets = [];
        }
    }

    if (isMined && status === 0) {
        type = 'failed';
    }

    const vin: EnhancedVinVout[] = [
        {
            addresses: [tx.from],
            isAddress: true,
            n: 0,
            ...(me && { isAccountOwned: isFromMe }),
        },
    ];

    const vout: EnhancedVinVout[] = tx.to
        ? [
              {
                  addresses: [tx.to],
                  isAddress: true,
                  value: value.toString(),
                  n: 0,
                  ...(me && { isAccountOwned: isToMe }),
              },
          ]
        : [];

    return {
        type,
        txid: tx.hash,
        blockTime: blockTime ?? (block ? Number(block.timestamp) : 0),
        blockHeight: Number(tx.blockNumber),
        blockHash,
        amount,
        fee,
        targets,
        tokens,
        internalTransfers,
        details: {
            vin,
            vout,
            size: tx.input ? (tx.input.length - 2) / 2 : 0,
            totalInput: value.toString(),
            totalOutput: value.toString(),
        },
        ethereumSpecific: {
            status,
            nonce: tx.nonce,
            gasLimit: Number(tx.gas),
            gasUsed: Number(receipt.gasUsed),
            gasPrice: gasPrice?.toString(),
            effectiveGasPrice: effectiveGasPrice > 0n ? effectiveGasPrice.toString() : undefined,
            createdContract: receipt.contractAddress ?? undefined,
            data: tx.input,
        },
    };
};

export const mapGetTransactionResponse = (
    params: MapTransactionParams,
): Responses.GetTransaction => ({
    type: RESPONSES.GET_TRANSACTION,
    payload: mapTransaction(params),
});
