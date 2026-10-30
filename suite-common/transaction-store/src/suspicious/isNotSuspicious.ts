import type { Expression, SqlBool } from 'kysely';

import { type NetworkSymbol, type NetworkType, getNetworkType } from '@suite-common/wallet-config';

import {
    type TransactionsExpressionBuilder,
    type TransfersExpressionBuilder,
    someTransfer,
} from '../query/transactionStoreDatabase';
import type { SuspiciousTransactionsContext } from '../transactionStoreTypes';

type Detector = 'zero' | 'fakeToken' | 'unknown' | 'trc10' | 'unsolicitedAssetOffer';

/**
 * The app's `PHISHING_VALIDATORS` in `@suite-common/token-definitions`, less the dust detector,
 * mirrored in SQL so hiding suspicious transactions filters, pages and counts in the database over
 * the whole stored history. Dust needs fiat rates, which only the app has and only for the
 * transactions it loaded; it hands those over as `flaggedTxids`. Networks not listed have nothing
 * suspicious. Keep the two in step.
 */
const DETECTORS_BY_NETWORK_TYPE: Partial<Record<NetworkType, Detector[]>> = {
    bitcoin: ['zero'],
    ethereum: ['fakeToken', 'zero'],
    cardano: ['fakeToken'],
    solana: ['fakeToken'],
    stellar: ['unsolicitedAssetOffer', 'unknown', 'fakeToken'],
    tron: ['trc10', 'fakeToken'],
};

/** The app's `NFT_TOKEN_STANDARDS`; definitions list NFTs apart from coins. */
const NFT_STANDARDS = ['ERC721', 'TRC721', 'BEP721', 'ERC1155', 'TRC1155', 'BEP1155'];

/** The app's `PHISHING_WHITELISTED_TX_TYPES`: never suspicious, whatever they move. */
const WHITELISTED_TYPES = ['sent', 'self', 'joint', 'failed'];

type DetectorParams = { eb: TransactionsExpressionBuilder; symbol: NetworkSymbol };

const isTokenMovingAmount = (fb: TransfersExpressionBuilder) =>
    fb.and([fb('f.kind', '=', 'token'), fb(fb.cast<number>('f.amount', 'real'), '!=', 0)]);

// A token-only transaction has no native transfer row.
const movesNoCoin = (eb: TransactionsExpressionBuilder) =>
    eb.not(someTransfer(eb, fb => fb('f.kind', '=', 'native')));

const hasTokens = (eb: TransactionsExpressionBuilder) =>
    someTransfer(eb, fb => fb('f.kind', '=', 'token'));

/** A token the definitions know, moving an amount: the app's "legit" token. */
const hasLegitToken = ({ eb, symbol }: DetectorParams) =>
    someTransfer(eb, fb => {
        // The contract as the definitions list it: the app's `getContractAddressForNetworkSymbol`.
        const toContractKey = () => {
            switch (getNetworkType(symbol)) {
                case 'ethereum':
                    return fb.fn<string>('lower', ['f.contract']);
                // The policy id: the asset's first 28 bytes.
                case 'cardano':
                    return fb.fn<string>('lower', [
                        fb.fn('substr', ['f.contract', fb.val(1), fb.val(56)]),
                    ]);
                default:
                    return fb.ref('f.contract');
            }
        };
        const kind = fb
            .case()
            .when('f.standard', 'in', NFT_STANDARDS)
            .then(fb.val<'coin' | 'nft'>('nft'))
            .else(fb.val<'coin' | 'nft'>('coin'))
            .end();

        return fb.and([
            isTokenMovingAmount(fb),
            fb.exists(
                fb
                    .selectFrom('known_tokens as k')
                    .select(kb => kb.lit(1).as('one'))
                    .where('k.symbol', '=', symbol)
                    .where(kb => kb('k.kind', '=', kind))
                    .where(kb => kb('k.contract', '=', toContractKey())),
            ),
        ]);
    });

const toDetector = (detector: Detector, params: DetectorParams): Expression<SqlBool> => {
    const { eb, symbol } = params;

    switch (detector) {
        case 'zero':
            return eb.and([
                eb('t.type', 'not in', WHITELISTED_TYPES),
                movesNoCoin(eb),
                hasTokens(eb),
                eb.not(someTransfer(eb, isTokenMovingAmount)),
            ]);
        case 'unknown':
            return eb('t.type', '=', 'unknown');
        // `IS`, not `=`: a missing field must read as false, as `NULL` would hide the whole row.
        case 'trc10':
            return eb(
                eb.fn('json_extract', ['t.data', eb.val('$.tronSpecific.contractType')]),
                'is',
                'TransferAssetContract',
            );
        case 'unsolicitedAssetOffer':
            return eb(
                eb.fn('json_extract', [
                    't.data',
                    eb.val('$.stellarSpecific.claimableBalanceOffer.isClaimant'),
                ]),
                'is',
                1,
            );
        case 'fakeToken':
            return eb.and([
                // Only once the app fed the network's definitions; before, no token is "fake".
                eb.exists(
                    eb
                        .selectFrom('token_definition_networks as d')
                        .select(db => db.lit(1).as('one'))
                        .where('d.symbol', '=', symbol),
                ),
                movesNoCoin(eb),
                hasTokens(eb),
                eb.not(hasLegitToken(params)),
            ]);
    }
};

export type IsNotSuspiciousParams = SuspiciousTransactionsContext & {
    /** The network of the transactions the condition is on. */
    symbol: NetworkSymbol;
};

/** The condition keeping only the transactions that are not suspicious, on those aliased `t`. */
export const isNotSuspicious = (
    eb: TransactionsExpressionBuilder,
    { symbol, notScamTxids, flaggedTxids }: IsNotSuspiciousParams,
) => {
    const detectors = DETECTORS_BY_NETWORK_TYPE[getNetworkType(symbol)] ?? [];
    const isSuspicious = [
        ...detectors.map(detector => toDetector(detector, { eb, symbol })),
        ...(flaggedTxids.length > 0 ? [eb('t.txid', 'in', flaggedTxids)] : []),
    ];

    if (isSuspicious.length === 0) return eb.lit(true);

    return eb.not(
        eb.and([
            ...(notScamTxids.length > 0 ? [eb('t.txid', 'not in', notScamTxids)] : []),
            eb.or(isSuspicious),
        ]),
    );
};
