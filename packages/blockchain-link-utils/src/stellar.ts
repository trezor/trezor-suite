import type {
    StellarOperationType,
    TokenDetailByMint,
    Transaction,
} from '@trezor/blockchain-link-types';
import { isCodesignBuild } from '@trezor/env-utils';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import type {
    IdentifiedTransaction,
    StellarAssetAmount,
    StellarBalanceDelta,
    TokenTransferInfo,
} from '@trezor/network-stellar/types';
import { BigNumber } from '@trezor/utils';

/**
 * One host-function operation can move several assets at once, so only the transfers the
 * account takes part in are kept — the rest belong to other participants of the same call.
 */
const transformTokenTransfers = (
    baseTx: Omit<Transaction, 'type'>,
    transfers: readonly TokenTransferInfo[],
    descriptor: string,
    tokenDetailByMint: TokenDetailByMint,
): Transaction => {
    const ownTransfers = transfers.filter(
        ({ fromAddress, toAddress }) => descriptor === fromAddress || descriptor === toAddress,
    );

    if (ownTransfers.length === 0) {
        return { ...baseTx, type: 'unknown' };
    }

    const isSender = ownTransfers.some(({ fromAddress }) => descriptor === fromAddress);
    const isRecipient = ownTransfers.some(({ toAddress }) => descriptor === toAddress);

    let type: 'self' | 'sent' | 'recv' = 'recv';
    if (isSender) {
        type = isRecipient ? 'self' : 'sent';
    }

    return {
        ...baseTx,
        type,
        amount: '0', // No native amount for token transfers
        tokens: ownTransfers.map(({ assetCode, assetIssuer, amount, fromAddress, toAddress }) => {
            const contract = `${assetCode}-${assetIssuer}`;

            return {
                type: descriptor === fromAddress ? 'sent' : 'recv',
                standard: 'STELLAR-CLASSIC',
                from: fromAddress,
                to: toAddress,
                contract,
                name: tokenDetailByMint[contract]?.name || assetCode,
                symbol: assetCode,
                decimals: STELLAR_DECIMALS,
                amount,
            };
        }),
    };
};

/** A movement of the account's own balance: signed stroops, native when `asset` is absent. */
type OwnMovement = Pick<StellarBalanceDelta, 'asset' | 'amount'>;

const negated = ({ asset, amount }: StellarAssetAmount): OwnMovement => ({
    asset,
    amount: new BigNumber(amount).negated().toString(),
});

/**
 * The account's own legs of what moved, and the nearest holder on the other side. Effects name
 * the real holder rather than the account Horizon stamps on every one, so the other legs of a
 * swap belong to the router and the pool it routed through.
 */
const selectOwnMovements = (deltas: readonly StellarBalanceDelta[], descriptor: string) => ({
    movements: deltas.filter(({ holder }) => holder === descriptor),
    counterparty: deltas.find(({ holder }) => holder !== descriptor)?.holder,
});

type LabelledParams = {
    baseTx: Omit<Transaction, 'type'>;
    operationType?: StellarOperationType;
};

const labelled = ({ baseTx, operationType }: LabelledParams): Omit<Transaction, 'type'> =>
    operationType
        ? { ...baseTx, stellarSpecific: { ...baseTx.stellarSpecific!, operationType } }
        : baseTx;

type TransformMovementsParams = {
    baseTx: Omit<Transaction, 'type'>;
    movements: readonly OwnMovement[];
    descriptor: string;
    /** The address on the other side, where the operation or the effects name one. */
    counterparty?: string;
    tokenDetailByMint: TokenDetailByMint;
};

/**
 * Builds a record from the account's own movements. Value leaving and arriving in the same
 * transaction is a conversion — a swap, or a transfer to itself — which the transaction type
 * shared with every other network spells `self`.
 */
const transformMovements = ({
    baseTx,
    movements,
    descriptor,
    counterparty,
    tokenDetailByMint,
}: TransformMovementsParams): Transaction => {
    if (movements.length === 0) {
        return { ...baseTx, type: 'unknown' };
    }

    const isSender = movements.some(({ amount }) => new BigNumber(amount).isNegative());
    const isRecipient = movements.some(({ amount }) => new BigNumber(amount).isPositive());

    let type: 'self' | 'sent' | 'recv' = 'recv';
    if (isSender) {
        type = isRecipient ? 'self' : 'sent';
    }

    // A path payment can both leave and arrive in lumens — a round trip through the order books —
    // and the account moved only the difference. Reading the first native leg alone would drop the
    // other side. Balance-change deltas arrive netted per asset already, so this is a no-op there.
    const nativeMovements = movements.filter(({ asset }) => !asset);
    const nativeTotal = nativeMovements.reduce(
        (total, { amount }) => total.plus(amount),
        new BigNumber(0),
    );
    const hasNative = nativeMovements.length > 0;
    const nativeAmount = nativeTotal.abs().toString();
    const isNativeIncoming = hasNative && nativeTotal.isGreaterThan(0);
    const hasAssetLeg = movements.some(({ asset }) => !!asset);
    const other = counterparty ?? descriptor;

    // Lumens arriving next to an asset leaving is the receiving side of a conversion, and
    // `amount` with a target is how the shared transaction shape says "sent": read that way, the
    // lumens received would render as lumens paid out. An internal transfer carries its own
    // direction, which is what every other network's swap uses for the same reason.
    const isNativeSwapLeg = isNativeIncoming && hasAssetLeg;

    // A target names who received the lumens, which is the account itself when they arrived — the
    // convention the plain payment path follows. Naming the counterparty either way would show a
    // credit as a payment to someone else.
    const nativeRecipient = isNativeIncoming ? descriptor : counterparty;
    const nativeTargets =
        hasNative && !isNativeSwapLeg && nativeRecipient
            ? [{ n: 0, addresses: [nativeRecipient], isAddress: true, amount: nativeAmount }]
            : [];

    return {
        ...baseTx,
        type,
        amount: isNativeSwapLeg ? '0' : nativeAmount,
        internalTransfers: isNativeSwapLeg
            ? [{ type: 'recv' as const, from: other, to: descriptor, amount: nativeAmount }]
            : [],
        tokens: movements.flatMap(({ asset, amount }) => {
            if (!asset) return [];

            const isOutgoing = new BigNumber(amount).isNegative();
            const contract = `${asset.assetCode}-${asset.assetIssuer}`;
            // Effects name no counterparty of their own, so the issuer stands in — the same
            // convention the balance-change path uses for a mint or a burn.
            const assetOther = counterparty ?? asset.assetIssuer;

            return [
                {
                    type: isOutgoing ? ('sent' as const) : ('recv' as const),
                    standard: 'STELLAR-CLASSIC' as const,
                    from: isOutgoing ? descriptor : assetOther,
                    to: isOutgoing ? assetOther : descriptor,
                    contract,
                    name: tokenDetailByMint[contract]?.name || asset.assetCode,
                    symbol: asset.assetCode,
                    decimals: STELLAR_DECIMALS,
                    amount: new BigNumber(amount).abs().toString(),
                },
            ];
        }),
        targets: nativeTargets,
    };
};

export const transformTransaction = (
    identifiedTx: IdentifiedTransaction,
    descriptor: string,
    tokenDetailByMint: TokenDetailByMint,
): Transaction => {
    const { memo, feeSource, hash, fee, createdAt, ledgerAttr, ...parsed } = identifiedTx;

    const baseTx: Omit<Transaction, 'type'> = {
        txid: hash,
        amount: '0',
        fee,
        blockTime: createdAt,
        blockHeight: ledgerAttr,
        targets: [],
        tokens: [],
        internalTransfers: [],
        feeRate: undefined,
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
        stellarSpecific: { memo, feeSource },
    };

    switch (parsed.type) {
        case 'unknown':
            return { ...baseTx, type: 'unknown' };
        case 'failed':
            return { ...baseTx, type: 'failed' };
        case 'change-trust':
            return descriptor !== parsed.fromAddress
                ? { ...baseTx, type: 'unknown' }
                : {
                      ...baseTx,
                      type: 'self',
                      stellarSpecific: {
                          ...baseTx.stellarSpecific!,
                          operationType: 'changeTrust',
                          changeTrust: { assetCode: parsed.assetCode, isRemoval: parsed.isRemoval },
                      },
                  };
        case 'token-transfer':
            return transformTokenTransfers(baseTx, parsed.transfers, descriptor, tokenDetailByMint);
        case 'contract-call': {
            const { invocation, transfers, deltas } = parsed;
            const contractTx: Omit<Transaction, 'type'> = invocation
                ? {
                      ...baseTx,
                      stellarSpecific: { ...baseTx.stellarSpecific!, contractCall: invocation },
                  }
                : baseTx;

            const transferTx = transformTokenTransfers(
                contractTx,
                transfers,
                descriptor,
                tokenDetailByMint,
            );

            if (transferTx.type !== 'unknown') {
                return transferTx;
            }

            // The balance changes are classic assets only, so a call that moved lumens - which is
            // every swap priced in XLM - has nothing to show there. The effects do know, and they
            // name the real holder, so the account's own legs are the ones that moved.
            const { movements, counterparty } = selectOwnMovements(deltas, descriptor);

            if (movements.length > 0) {
                return transformMovements({
                    baseTx: contractTx,
                    movements,
                    descriptor,
                    counterparty,
                    tokenDetailByMint,
                });
            }

            // Only a Stellar Asset Contract reports its transfers as balance changes, so a call
            // moving contract tokens has none to show. The decoded call still says what ran, which
            // beats presenting the transaction as unknown.
            return invocation ? { ...contractTx, type: 'contract' } : transferTx;
        }
        case 'path-payment': {
            const { fromAddress, toAddress, sent, received, operationType } = parsed;
            const isSender = descriptor === fromAddress;
            const isRecipient = descriptor === toAddress;

            if (!isSender && !isRecipient) {
                return { ...baseTx, type: 'unknown' };
            }

            return transformMovements({
                baseTx: labelled({ baseTx, operationType }),
                // Sent to itself, the two legs are the two sides of a conversion.
                movements: [
                    ...(isSender ? [negated(sent)] : []),
                    ...(isRecipient ? [received] : []),
                ],
                descriptor,
                counterparty: isSender ? toAddress : fromAddress,
                tokenDetailByMint,
            });
        }
        case 'balance-change': {
            const { deltas, operationType } = parsed;
            const { movements, counterparty } = selectOwnMovements(deltas, descriptor);

            return transformMovements({
                baseTx: labelled({ baseTx, operationType }),
                movements,
                descriptor,
                counterparty,
                tokenDetailByMint,
            });
        }
        case 'ledger-change':
            // The operation changed the ledger without moving value — options set, a data entry
            // written, an offer placed. The label is the whole story; an amount would be a fiction.
            return { ...labelled({ baseTx, operationType: parsed.operationType }), type: 'self' };
        case 'claimable-balance-offer': {
            const { fromAddress, claimants, asset, offeredAmount, operationType } = parsed;
            const isCreator = descriptor === fromAddress;

            if (!isCreator && !claimants.includes(descriptor)) {
                return { ...baseTx, type: 'unknown' };
            }

            const offer = labelled({ baseTx, operationType });
            const withOffer: Omit<Transaction, 'type'> = {
                ...offer,
                stellarSpecific: {
                    ...offer.stellarSpecific!,
                    claimableBalanceOffer: { isClaimant: !isCreator, offeredAmount },
                },
            };

            // A claimant has been offered value, not paid it: the balance arrives only if it
            // claims, and that claim reports the credit. Giving the offer an amount now would
            // overstate the balance — and this is the shape unsolicited-asset spam takes on
            // Stellar, so it must not read as a payment received either.
            if (!isCreator) {
                return { ...withOffer, type: 'recv' };
            }

            return transformMovements({
                baseTx: withOffer,
                movements: [negated({ asset, amount: offeredAmount })],
                descriptor,
                counterparty: claimants[0],
                tokenDetailByMint,
            });
        }
        default: {
            if (descriptor !== parsed.fromAddress && descriptor !== parsed.toAddress)
                // Transaction does not involve the user's address
                return { ...baseTx, type: 'unknown' };
        }
    }

    const { fromAddress, toAddress } = parsed;

    const type = descriptor === fromAddress ? 'sent' : 'recv';

    // Native asset transfer
    const nativeAmount = parsed.amount.toString();

    return {
        ...baseTx,
        type,
        amount: nativeAmount,
        targets: [
            {
                n: 0,
                addresses: [toAddress],
                isAddress: true,
                amount: nativeAmount,
            },
        ],
        details: {
            vin: [
                {
                    n: 0,
                    addresses: [fromAddress],
                    isAddress: true,
                    value: nativeAmount,
                },
            ],
            vout: [
                {
                    n: 0,
                    addresses: [toAddress],
                    isAddress: true,
                    value: nativeAmount,
                },
            ],
            size: 0,
            totalInput: nativeAmount,
            totalOutput: nativeAmount,
        },
    };
};

export const getTokenMetadata = async (): Promise<TokenDetailByMint> => {
    const env = isCodesignBuild() ? 'stable' : 'develop';

    const response = await fetch(
        `https://data.trezor.io/suite/definitions/${env}/stellar.advanced.coin.definitions.v1.json`,
    );

    if (!response.ok) {
        throw Error(`Failed to fetch token metadata: ${response.statusText}`);
    }

    const data: TokenDetailByMint = await response.json();

    return data;
};
