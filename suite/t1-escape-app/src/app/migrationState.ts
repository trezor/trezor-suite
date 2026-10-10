import type { Leftover, SweepPlan } from '../bitcoin/composeSweep';
import type { Destination, DestinationError } from '../bitcoin/destinationAddress';
import type { DiscoveredAccount } from '../device/accountPublicKey';
import type { AcquireError, BridgeConnectError } from '../device/createBridgeConnection';
import type { DeviceRejection, SupportedDevice } from '../device/deviceFeatures';
import type { DeviceCallError, DeviceLostReason } from '../device/deviceSession';
import type { PassphraseEntryError } from '../device/passphrase';
import type { DiscoveryError, ScannedAccount } from '../discovery/discoverAccounts';
import type {
    EthereumDiscoveryError,
    EthereumScannedAddress,
} from '../discovery/discoverEthereumAddresses';
import type { DiscoveryAbortError } from '../discovery/discoverWallet';
import type { WalletKind } from '../discovery/scanReport';
import type { EthereumSweepPlan } from '../ethereum/composeEthereumSweep';
import type { EthereumAccount } from '../ethereum/ethereumAccount';
import { ETHEREUM_CHAINS, type EthereumChain } from '../ethereum/ethereumChain';
import type {
    EthereumDestination,
    EthereumDestinationError,
} from '../ethereum/ethereumDestination';
import type { SignedEthereumSweepRecord } from '../migration/ethereumSweepLedger';
import {
    type EthereumSweepStatus,
    isFinalEthereumSweepStatus,
} from '../migration/ethereumSweepStatus';
import type {
    EthereumLeftover,
    PrepareEthereumSweepError,
} from '../migration/prepareEthereumSweep';
import type { PrepareSweepError } from '../migration/prepareSweep';
import type { SignEthereumSweepError } from '../migration/signEthereumSweep';
import type { SignSweepError } from '../migration/signSweep';
import type { SignedSweepRecord } from '../migration/sweepLedger';
import type { SweepStatus } from '../migration/sweepStatus';
import type { EnvironmentIssue } from '../preflight/environment';
import type { LocalNetworkAccessState } from '../preflight/localNetworkAccess';

export type MigrationStep =
    | 'intro'
    | 'preflight'
    | 'device'
    | 'passphrase'
    | 'discovery'
    | 'destination'
    | 'transfers'
    | 'summary';

/** The coins the page moves. Each one that was found gets its own destination address. */
export type Coin = 'bitcoin' | EthereumChain;

export const isEthereumChain = (coin: Coin): coin is EthereumChain => coin !== 'bitcoin';

/** The addresses typed by the user, one per coin that has something to move. */
export type DestinationInputs = Partial<Record<Coin, string>>;

export type PreflightIssue =
    | { type: EnvironmentIssue }
    | { type: 'permission-denied' }
    | (BridgeConnectError & { permission: LocalNetworkAccessState });

export type DeviceIssue =
    | { type: 'no-device' }
    | { type: 'other-trezor' }
    | { type: 'several-legacy-trezors' }
    | AcquireError
    | DeviceRejection
    | DeviceCallError;

/**
 * Life of a transfer on this page. The page never broadcasts: after signing it shows the hex,
 * the user broadcasts it elsewhere, and the page watches the network for it.
 */
export type TransferStage =
    /** Composed and waiting for the user to start signing. */
    | 'ready'
    | 'signing'
    /**
     * Signed. The hex exists on this page and the network has not shown the transaction yet. It
     * is never signed again; the page keeps asking the network until the transaction appears.
     */
    | 'signed'
    /** The page saw the transaction on the network. Its fate is tracked through `status`. */
    | 'on-network';

export type TransferError = PrepareSweepError | SignSweepError;

export type Transfer = {
    key: string;
    account: DiscoveredAccount;
    stage: TransferStage;
    /** Undefined when the account holds nothing that can be moved. */
    plan?: SweepPlan;
    leftovers: Leftover[];
    /** Transactions needed after this one, because of the input limit per transaction. */
    followingTransactions: number;
    /** Transfers of this account that were already in the mempool when it was loaded. */
    inFlightTransactions: number;
    record?: SignedSweepRecord;
    status?: SweepStatus;
    error?: TransferError;
};

export type EthereumTransferError = PrepareEthereumSweepError | SignEthereumSweepError;

/** The sweep of one Ethereum address. Mirrors `Transfer`, with the Ethereum types. */
export type EthereumTransfer = {
    key: string;
    account: EthereumAccount;
    stage: TransferStage;
    /** Undefined when the address holds nothing that can be moved right now. */
    plan?: EthereumSweepPlan;
    leftover?: EthereumLeftover;
    /** A transaction of the address is in the mempool. Nothing is composed until it settles. */
    isInFlight: boolean;
    record?: SignedEthereumSweepRecord;
    status?: EthereumSweepStatus;
    error?: EthereumTransferError;
};

/** The Bitcoin side of the migration: what was found, where it goes and what moves it. */
export type BitcoinState = {
    accounts: ScannedAccount[];
    /** A scan of the accounts failed. The accounts are the ones reached before. */
    discoveryError?: DiscoveryError;
    destination?: Destination;
    destinationError?: DestinationError;
    transfers: Transfer[];
};

/** The same for one Ethereum chain, which is found and moved address by address. */
export type EthereumChainState = {
    addresses: EthereumScannedAddress[];
    /** A scan of the addresses failed. The addresses are the ones reached before. */
    discoveryError?: EthereumDiscoveryError;
    destination?: EthereumDestination;
    destinationError?: EthereumDestinationError;
    transfers: EthereumTransfer[];
};

export type MigrationState = {
    step: MigrationStep;
    /** Short description of the operation in progress, or undefined when idle. */
    activity?: string;
    /** Message of an error nobody anticipated. The flow stops; nothing is retried. */
    unexpectedError?: string;
    preflightIssue?: PreflightIssue;
    deviceIssue?: DeviceIssue;
    device?: SupportedDevice;
    /** Set once and for all when the device is unplugged or taken by another client. */
    deviceLostReason?: DeviceLostReason;
    isDeviceReleased: boolean;
    /** The device confirmed that it forgot the PIN and the passphrase before it was released. */
    isDeviceLocked: boolean;
    isPinRequested: boolean;
    /** The device shows something the user has to confirm with its buttons. */
    isConfirmationOnDeviceRequested: boolean;
    passphraseError?: PassphraseEntryError;
    /** The device could not be read, so the discovery stopped before it could finish. */
    discoveryError?: DiscoveryAbortError;
    /** Set once the discovery finished, with or without a server error of a single coin. */
    walletKind?: WalletKind;
    bitcoin: BitcoinState;
    ethereum: Record<EthereumChain, EthereumChainState>;
};

/** One value per Ethereum chain. A new chain fails to compile here until it is listed. */
export const mapEthereumChains = <T>(
    getValue: (chain: EthereumChain) => T,
): Record<EthereumChain, T> => ({
    ethereum: getValue('ethereum'),
    'ethereum-classic': getValue('ethereum-classic'),
});

// Nothing more happens to a transfer that is confirmed, or whose coins another transaction took.
const isFinalSweepStatus = (status: SweepStatus | undefined) =>
    status === 'confirmed' || status === 'spent-by-another-transaction';

/**
 * True while the fate of some transfer of the old wallet is still open on the network. A signed
 * transfer counts: the network is watched for it until the user's broadcast shows up.
 */
export const isTransferUnsettled = ({ stage, status, inFlightTransactions }: Transfer) =>
    stage === 'signed' ||
    (stage === 'on-network' && !isFinalSweepStatus(status)) ||
    inFlightTransactions > 0;

export const isEthereumTransferUnsettled = ({ stage, status, isInFlight }: EthereumTransfer) =>
    stage === 'signed' ||
    (stage === 'on-network' && !isFinalEthereumSweepStatus(status)) ||
    isInFlight;

/** The transfers of every Ethereum chain, in chain order. */
export const getEthereumTransfers = ({ ethereum }: MigrationState) =>
    ETHEREUM_CHAINS.flatMap(chain => ethereum[chain].transfers);

/** True while a transfer of any coin still has to be followed on the network. */
export const hasUnsettledTransfers = (state: MigrationState) =>
    state.bitcoin.transfers.some(isTransferUnsettled) ||
    getEthereumTransfers(state).some(isEthereumTransferUnsettled);

const getTransferStages = (state: MigrationState) => [
    ...state.bitcoin.transfers.map(({ stage }) => stage),
    ...getEthereumTransfers(state).map(({ stage }) => stage),
];

/** True once a transfer of any coin reached the device. */
export const isAnythingSigned = (state: MigrationState) =>
    getTransferStages(state).some(stage => stage !== 'ready');

/** A signed transaction the network has not shown yet exists only on the transfers screen. */
export const hasUnsentTransaction = (state: MigrationState) =>
    getTransferStages(state).some(stage => stage === 'signed');

/** Accounts hold something worth a transfer when they have unspent outputs. */
export const hasBitcoinToMove = (accounts: readonly ScannedAccount[]) =>
    accounts.some(({ snapshot }) => snapshot.utxos.length > 0);

/** An address worth a transfer: a balance to move, or a pending transaction that may bring one. */
export const holdsEthereum = ({ info }: EthereumScannedAddress) =>
    info.balance !== '0' || info.unconfirmedTransactions > 0;

export const hasEthereumToMove = (addresses: readonly EthereumScannedAddress[]) =>
    addresses.some(holdsEthereum);

/** The coins that have something to move, in screen order. Each needs a destination. */
export const getCoinsToMove = ({ bitcoin, ethereum }: MigrationState): Coin[] => [
    ...(hasBitcoinToMove(bitcoin.accounts) ? (['bitcoin'] as const) : []),
    ...ETHEREUM_CHAINS.filter(chain => hasEthereumToMove(ethereum[chain].addresses)),
];

export const INITIAL_BITCOIN_STATE: BitcoinState = {
    accounts: [],
    transfers: [],
};

export const INITIAL_ETHEREUM_CHAIN_STATE: EthereumChainState = {
    addresses: [],
    transfers: [],
};

export const INITIAL_MIGRATION_STATE: MigrationState = {
    step: 'intro',
    isDeviceReleased: false,
    isDeviceLocked: false,
    isPinRequested: false,
    isConfirmationOnDeviceRequested: false,
    bitcoin: INITIAL_BITCOIN_STATE,
    ethereum: mapEthereumChains(() => INITIAL_ETHEREUM_CHAIN_STATE),
};
