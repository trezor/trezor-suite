import type { Leftover, SweepPlan } from '../bitcoin/composeSweep';
import type { Destination, DestinationError } from '../bitcoin/destinationAddress';
import type { DiscoveredAccount } from '../device/accountPublicKey';
import type { AcquireError, BridgeConnectError } from '../device/createBridgeConnection';
import type { DeviceRejection, SupportedDevice } from '../device/deviceFeatures';
import type { DeviceCallError, DeviceLostReason } from '../device/deviceSession';
import type { PassphraseEntryError } from '../device/passphrase';
import type { DiscoveryError, ScannedAccount } from '../discovery/discoverAccounts';
import type { WalletKind } from '../discovery/scanReport';
import type { PrepareSweepError } from '../migration/prepareSweep';
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

export type TransferStage =
    /** Composed and waiting for the user to start signing. */
    | 'ready'
    | 'signing'
    /** Signed. The transaction can be exported and broadcast, never signed again. */
    | 'signed'
    | 'broadcasting'
    /** Handed to the network. Its fate is tracked through `status`. */
    | 'broadcast';

export type TransferError =
    PrepareSweepError | SignSweepError | { type: 'broadcast-failed'; message: string };

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
    discoveryError?: DiscoveryError;
    walletKind?: WalletKind;
    accounts: ScannedAccount[];
    destination?: Destination;
    destinationError?: DestinationError;
    transfers: Transfer[];
};

// Nothing more happens to a transfer that is confirmed, or whose coins another transaction took.
const isFinalSweepStatus = (status: SweepStatus | undefined) =>
    status === 'confirmed' || status === 'spent-by-another-transaction';

/** True while the fate of some transfer of the old wallet is still open on the network. */
export const isTransferUnsettled = ({ stage, status, inFlightTransactions }: Transfer) =>
    (stage === 'broadcast' && !isFinalSweepStatus(status)) || inFlightTransactions > 0;

export const INITIAL_MIGRATION_STATE: MigrationState = {
    step: 'intro',
    isDeviceReleased: false,
    isDeviceLocked: false,
    isPinRequested: false,
    isConfirmationOnDeviceRequested: false,
    accounts: [],
    transfers: [],
};
