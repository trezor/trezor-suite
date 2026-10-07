import type {
    AccountAddresses,
    BlockbookTransaction,
    TokenInfo,
    Transaction,
} from '@trezor/blockchain-link-types';
import type {
    AccountTransaction,
    AccountUtxo,
    DeviceIdentity,
    PROTO,
} from '@trezor/connect-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type {
    ExcludedUtxos,
    FeeInfo,
    FeeLevelLabel,
    GeneralPrecomposedLevels,
    GeneralPrecomposedTransactionFinal,
    Output,
    RbfTransactionParams,
} from './PrecomposedTransaction';
import type { AccountType } from '../../SuiteCommonNetworkConfig';

export type SendFormOption =
    | 'broadcast'
    | 'utxoSelection'
    | 'bitcoinLocktime'
    | 'transactionData'
    | 'ethereumNonce'
    | 'destinationTag';

export type UtxoSorting = 'newestFirst' | 'oldestFirst' | 'smallestFirst' | 'largestFirst';

/**
 * What the user asked to send: the send form's values that composing and signing read. The app's
 * form state extends it with what only the UI needs, so it is passed as is.
 */
export interface ChainSendDraft {
    outputs: Output[]; // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevelLabel;
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    maxPriorityFeePerGas?: string; // ethereum eip1559 only
    maxFeePerGas?: string; // ethereum eip1559 only
    feeLimit: string; // ethereum: gas limit; tron: fee_limit cap in SUN for TRC-20 transfers
    estimatedFeeLimit?: string; // ethereum: estimated gas limit; tron: estimated fee_limit cap in SUN for TRC-20 transfers

    /**
     * Fee that was paid by chained transactions. To perform RBF transaction (bump fee or cancel)
     * we must pay higher fee than all previous transactions + its own relay fee (see BIP-125 rules)
     *
     * This is passed down to `utxo-lib` as `baseFee` parameter (see `CoinSelectOptions`).
     */
    baseFee?: number;

    // advanced form inputs
    options: SendFormOption[];
    bitcoinLocktimeBlockHeight?: string;
    bitcoinLocktimeDatetime?: string;
    ethereumNonce?: string;
    ethereumAdjustGasLimit?: string; // if used, final gas limit = estimated limit * ethereumAdjustGasLimit
    transactionData?: string; // used for solana serialized txn from trading api, ethereum, tron txn hex data or bitcoin psbt hex data
    destinationTag?: string; // For Ripple, Stellar, Solana, and Tron
    rbfParams?: RbfTransactionParams;
    isCoinControlEnabled: boolean;
    selectedUtxos: AccountUtxo[];
    utxoSorting?: UtxoSorting;
}

/**
 * The sending account as composing and signing read it. A wallet account is passed as is.
 *
 * `misc` holds the family's own account data (nonce, sequence, resources); only the account's own
 * network reads it, which is why it is opaque here.
 */
export type ChainSendAccount = {
    readonly symbol: NetworkSymbol;
    readonly descriptor: string;

    /** The account's number within its type, which some networks derive further paths from. */
    readonly index: number;
    readonly path: string;
    readonly unlockPath?: PROTO.UnlockPath;
    readonly accountType: AccountType;

    /** The backend connection identity of the account's wallet. */
    readonly deviceState: string;
    readonly balance: string;
    readonly availableBalance: string;
    readonly formattedBalance: string;
    readonly addresses?: AccountAddresses;
    readonly utxo?: AccountUtxo[];
    readonly tokens?: TokenInfo[];
    readonly misc?: unknown;
};

/** Composing inputs the app owns: fee state, coin control and user settings. */
export type ChainComposeContext = {
    readonly feeInfo: FeeInfo;
    readonly excludedUtxos?: ExcludedUtxos;
    readonly prison?: Record<string, unknown>;

    /** Recipient to estimate fees against while the user has not entered one. */
    readonly feeEstimationRecipient?: string;

    /**
     * Treat the recipient as an account that does not exist yet, without asking the backend. Set
     * by flows that always pay a freshly created address, such as a trading partner's per-trade
     * deposit address.
     */
    readonly assumeNewAccount?: boolean;

    /** Keep the network's account reserve or rent out of what can be sent. */
    readonly isNetworkReserveEnabled?: boolean;

    /** The user enters amounts in the coin's smallest unit (satoshis), where the network allows. */
    readonly isSmallestUnitEnabled?: boolean;
};

export type ComposeFeeLevelsParams = {
    account: ChainSendAccount;
    draft: ChainSendDraft;
    context: ChainComposeContext;
    signal?: AbortSignal;
};

export type ChainSendDevice = DeviceIdentity & { useEmptyPassphrase?: boolean };

/** Signing inputs the app owns: the device and the user's display settings. */
export type ChainSignOptions = {
    readonly device: ChainSendDevice;

    /** Show long addresses and data in chunks on the device. */
    readonly chunkify?: boolean;
    readonly paymentRequests?: PROTO.PaymentRequest[];

    /** The unit the device shows amounts in, where the network allows. */
    readonly amountUnit?: PROTO.AmountUnit;

    /**
     * The transaction a replacement (RBF) spends again, from the wallet's own history. Signing
     * then need not ask the backend for it, which would tell the backend which one is replaced.
     */
    readonly replacedTransactions?: AccountTransaction[];

    /**
     * Called with what is about to be signed, before the device asks the user, so the app can show
     * it next to the device prompt.
     */
    readonly onPrepared?: (prepared: ChainSigningPrepared) => void;
};

export type ChainSigningPrepared = {
    /** The account nonce the transaction is signed with, on networks that order by nonce. */
    readonly nonce?: string;
};

export type SignChainTransactionParams = {
    account: ChainSendAccount;
    draft: ChainSendDraft;
    precomposed: GeneralPrecomposedTransactionFinal;
    options: ChainSignOptions;
};

export type ChainSignedTransaction = {
    /** The signed transaction, encoded as the backend expects it. */
    readonly serializedTx: string;

    /** The decoded transaction, where signing returns it (Bitcoin-like networks). */
    readonly signedTransaction?: BlockbookTransaction;

    /** The account nonce the transaction is signed with, on networks that order by nonce. */
    readonly nonce?: string;
};

export type PushChainTransactionParams = {
    account: ChainSendAccount;
    serializedTx: string;
    isMevProtectionEnabled: boolean;
};

export type PushedChainTransaction = {
    readonly txid: string;
};

export type CreatePendingTransactionParams = {
    account: ChainSendAccount;
    precomposed: GeneralPrecomposedTransactionFinal;
    signed: ChainSignedTransaction;
    txid: string;
};

/**
 * Composing, signing and broadcasting on one network. Each call talks to the device or the
 * backend and returns plain data, so the app decides what to keep and where.
 *
 * @serviceContract
 */
export type ChainNetworkSend<TLevels extends GeneralPrecomposedLevels = GeneralPrecomposedLevels> =
    {
        /** Fee levels for the draft; problems with the draft come back as error levels. */
        composeFeeLevels: (params: ComposeFeeLevelsParams) => Promise<TLevels>;
        sign: (params: SignChainTransactionParams) => Promise<ChainSignedTransaction>;
        push: (params: PushChainTransactionParams) => Promise<PushedChainTransaction>;

        /** The broadcast transaction as the account's history shows it until the backend lists it. */
        createPendingTransaction: (params: CreatePendingTransactionParams) => Transaction;
    };

/** What a network implements; a generic pending transaction is used unless it builds its own. */
export type ChainNetworkSendDefinition<
    TLevels extends GeneralPrecomposedLevels = GeneralPrecomposedLevels,
> = Omit<ChainNetworkSend<TLevels>, 'createPendingTransaction'> &
    Partial<Pick<ChainNetworkSend<TLevels>, 'createPendingTransaction'>>;
