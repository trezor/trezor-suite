import { exhaustive } from '@trezor/type-utils';

import type { DeviceIssue, PreflightIssue, TransferError } from '../app/migrationState';
import type { ComposeSweepError, LeftoverReason } from '../bitcoin/composeSweep';
import type { DestinationError } from '../bitcoin/destinationAddress';
import type { PreviousTransactionError } from '../bitcoin/verifyPreviousTransactions';
import type { DeviceCallError, DeviceLostReason } from '../device/deviceSession';
import type { PassphraseEntryError } from '../device/passphrase';
import type { DiscoveryError } from '../discovery/discoverAccounts';
import type { EthereumDiscoveryError } from '../discovery/discoverEthereumAddresses';
import type { WalletKind } from '../discovery/scanReport';
import {
    type FirmwareVersion,
    formatFirmwareVersion,
    isDestinationFormatSupported,
} from '../firmware/firmwareSupport';
import type { AmbiguityReason } from '../migration/accountState';
import type { SweepStatus } from '../migration/sweepStatus';

const REQUIREMENTS =
    'You need a computer with Windows or macOS and Chrome, Edge, Brave or Firefox.';

export const describePreflightIssue = (issue: PreflightIssue): string => {
    switch (issue.type) {
        case 'unsupported-os':
            return `This tool does not work on this operating system. ${REQUIREMENTS}`;
        case 'unsupported-browser':
            return `Safari cannot reach Trezor Suite on this computer. ${REQUIREMENTS}`;
        case 'permission-denied':
            return 'Your browser blocks this page from reaching Trezor Suite on this computer. Open the site settings (the icon left of the address bar), set "Local network access" to Allow, and reload the page.';
        case 'bridge-unreachable':
            return issue.permission === 'prompt'
                ? 'Trezor Suite did not answer. If your browser asks whether this page may access devices on your local network, choose Allow. Then make sure the Trezor Suite desktop app is running and try again.'
                : 'Trezor Suite did not answer. Start the Trezor Suite desktop app and leave it running. You can minimize it, but do not close its window.';
        case 'bridge-outdated':
            return `Update Trezor Suite. The running version (bridge ${issue.version}) cannot talk to old Trezor One devices yet.`;
        default:
            return exhaustive(issue);
    }
};

export const describeDeviceLost = (reason: DeviceLostReason): string => {
    switch (reason) {
        case 'disconnected':
            return 'The Trezor was disconnected.';
        case 'session-taken':
            return 'Another application took over the Trezor.';
        case 'bridge-unreachable':
            return 'The connection to Trezor Suite was lost.';
        default:
            return exhaustive(reason);
    }
};

const describeFailure = (code: string, message: string) => {
    switch (code) {
        case 'Failure_PinInvalid':
            return 'The PIN was wrong.';
        case 'Failure_PinCancelled':
            return 'PIN entry was cancelled.';
        case 'Failure_ActionCancelled':
            return 'The action was cancelled on the Trezor.';
        case 'Failure_NotInitialized':
            return 'This Trezor has no wallet on it.';
        default:
            return `The Trezor reported an error: ${message || code}.`;
    }
};

export const describeDeviceCallError = (error: DeviceCallError): string => {
    switch (error.type) {
        case 'device-lost':
            return describeDeviceLost(error.reason);
        case 'transport':
            return `Communication with the Trezor failed (${error.code}).`;
        case 'failure':
            return describeFailure(error.code, error.message);
        case 'cancelled':
            return error.prompt === 'pin'
                ? 'PIN entry was cancelled.'
                : 'No passphrase was provided.';
        case 'unexpected-response':
            return `The Trezor answered in an unexpected way (${error.received}).`;
        case 'busy':
            return 'The Trezor is still busy with the previous request.';
        default:
            return exhaustive(error);
    }
};

export const isWrongPinError = (error: { type: string; code?: string }) =>
    error.type === 'failure' && error.code === 'Failure_PinInvalid';

export const describeDeviceIssue = (issue: DeviceIssue): string => {
    switch (issue.type) {
        case 'no-device':
            return 'No Trezor found. Connect your Trezor One with its USB cable.';
        case 'other-trezor':
            return 'The connected Trezor is not an old Trezor One. Update this device in Trezor Suite.';
        case 'several-legacy-trezors':
            return 'More than one old Trezor One is connected. Leave only the one you want to empty.';
        case 'unable-to-open':
            return 'The Trezor could not be opened. Another application may be using it, or Trezor Suite could not load its support for old devices. Close other wallet applications, reconnect the Trezor and try again.';
        case 'acquire-failed':
            return `The Trezor could not be opened (${issue.code}). Reconnect it and try again.`;
        case 'bootloader-mode':
            return 'The Trezor is in bootloader mode. Unplug it and plug it back in without holding any button.';
        case 'not-trezor-one':
            return 'This device is not a Trezor One. Update this device in Trezor Suite.';
        case 'firmware-too-old':
            return `Firmware ${formatFirmwareVersion(issue.firmwareVersion)} is older than this tool covers. Nothing was done.`;
        case 'firmware-too-new':
            return `Firmware ${formatFirmwareVersion(issue.firmwareVersion)} does not need this tool. Update this device in Trezor Suite.`;
        case 'not-initialized':
            return 'This Trezor has no wallet on it, so there is nothing to move.';
        case 'device-lost':
        case 'transport':
        case 'failure':
        case 'cancelled':
        case 'unexpected-response':
        case 'busy':
            return describeDeviceCallError(issue);
        default:
            return exhaustive(issue);
    }
};

export const describePassphraseError = (error: PassphraseEntryError): string => {
    switch (error) {
        case 'mismatch':
            return 'The two entries are not the same.';
        case 'too-long':
            return 'The passphrase is too long. This firmware accepts at most 50 bytes.';
        default:
            return exhaustive(error);
    }
};

export const describeDiscoveryError = (error: DiscoveryError | EthereumDiscoveryError): string => {
    switch (error.type) {
        case 'public-key-invalid':
            return 'The Trezor returned a public key that does not check out. Nothing was done.';
        case 'address-invalid':
            return 'The Trezor returned something that is not an address. Nothing was done.';
        case 'backend':
            return `The blockchain server could not be reached (${error.message}).`;
        case 'device-lost':
        case 'transport':
        case 'failure':
        case 'cancelled':
        case 'unexpected-response':
        case 'busy':
            return describeDeviceCallError(error);
        default:
            return exhaustive(error);
    }
};

export const describeWalletKind = (walletKind: WalletKind): string => {
    switch (walletKind) {
        case 'standard':
            return 'Standard wallet (no passphrase)';
        case 'passphrase-normalized':
            return 'Passphrase wallet';
        case 'passphrase-raw':
            return 'Passphrase wallet (passphrase used exactly as typed, without normalization)';
        default:
            return exhaustive(walletKind);
    }
};

export const describeDestinationError = (
    error: DestinationError,
    firmwareVersion: FirmwareVersion,
): string => {
    switch (error.type) {
        case 'empty':
            return 'Enter the address the bitcoin should go to.';
        case 'invalid':
            return 'This is not a valid Bitcoin address.';
        case 'own-address':
            return 'This address belongs to the old wallet on this Trezor. Enter a receive address of your new wallet.';
        case 'unsupported-format': {
            const version = formatFirmwareVersion(firmwareVersion);

            if (isDestinationFormatSupported(firmwareVersion, 'bech32')) {
                return `Firmware ${version} cannot send to Taproot addresses (bc1p…). On your new device, open a SegWit account and use a receive address that starts with bc1q.`;
            }

            return `Firmware ${version} can only send to addresses that start with 1 or 3. On your new device, open a Legacy SegWit account (addresses start with 3) or a Legacy account (addresses start with 1) and use a receive address from it.`;
        }
        default:
            return exhaustive(error);
    }
};

export const describeAmbiguity = (reason: AmbiguityReason): string => {
    switch (reason) {
        case 'utxo-spent-in-mempool':
            return 'the server lists coins as unspent that a pending transaction already spends';
        case 'pending-history-incomplete':
            return 'the server reports more pending transactions than it shows';
        case 'malformed-utxo':
            return 'the server lists coins with missing or invalid data';
        case 'duplicate-utxo':
            return 'the server lists the same coin twice';
        default:
            return exhaustive(reason);
    }
};

const describePreviousTransactionError = ({ type }: PreviousTransactionError): string => {
    switch (type) {
        case 'hash-mismatch':
        case 'unparsable-transaction':
        case 'missing-transaction':
        case 'missing-output':
            return 'a previous transaction delivered by the server is not the one being spent';
        case 'script-mismatch':
        case 'unexpected-input-path':
        case 'unexpected-script-type':
            return 'a coin does not belong to the address the server claims';
        case 'amount-mismatch':
            return 'the server reported a wrong amount for a coin';
        case 'duplicate-input':
            return 'the same coin was selected twice';
        case 'invalid-account-xpub':
            return 'the account key could not be used';
        default:
            return exhaustive(type);
    }
};

const describeComposeError = (error: ComposeSweepError): string => {
    switch (error.type) {
        case 'no-spendable-utxos':
            return 'There is nothing to move in this account.';
        case 'insufficient-for-fee':
            return 'The coins in this account do not cover the transaction fee.';
        case 'invalid-utxo':
            return 'The server returned a coin that cannot be used.';
        case 'compose-failed':
            return `The transaction could not be composed (${error.reason}).`;
        case 'invariant-violated':
            return `The composed transaction failed a safety check (${error.invariant}). Nothing was signed.`;
        case 'amount-not-unique':
            return 'No amount is left that was not shown before. Reload the page to start over.';
        default:
            return exhaustive(error);
    }
};

export const describeTransferError = (error: TransferError): string => {
    switch (error.type) {
        case 'ambiguous-state':
            return `The state of this account is unclear: ${error.reasons.map(describeAmbiguity).join('; ')}. Nothing will be signed until it clears up. Wait a few minutes and try again.`;
        case 'inputs-changed':
            return 'The coins of this account changed since the transfer was prepared. Nothing was signed.';
        case 'previous-transaction-invalid':
            return `Verification of the coins failed: ${describePreviousTransactionError(error.error)}. Nothing was signed. Do not continue; the blockchain server may be returning wrong data.`;
        case 'account-key-mismatch':
            return 'The Trezor now holds a different wallet than the one that was scanned. Nothing was signed. Reload the page and start again.';
        case 'plan-inconsistent':
            return 'The prepared transfer failed a consistency check. Nothing was signed.';
        case 'plan-already-attempted':
            return 'This transfer was already sent to the Trezor once. A new one was prepared with a different amount.';
        case 'inputs-already-signed':
            return 'A signed transaction for these coins already exists. Broadcast that one; nothing is signed again.';
        case 'signing-failed':
            return `Signing did not finish (${error.reason}).`;
        case 'signed-transaction-invalid':
            return `The transaction returned by the Trezor is not the one that was prepared (${error.reason}). It was discarded.`;
        case 'public-key-invalid':
            return 'The Trezor returned a public key that does not check out. Nothing was signed.';
        case 'backend':
            return `The blockchain server could not be reached (${error.message}).`;
        case 'no-spendable-utxos':
        case 'insufficient-for-fee':
        case 'invalid-utxo':
        case 'compose-failed':
        case 'invariant-violated':
        case 'amount-not-unique':
            return describeComposeError(error);
        case 'device-lost':
        case 'transport':
        case 'failure':
        case 'cancelled':
        case 'unexpected-response':
        case 'busy':
            return describeDeviceCallError(error);
        default:
            return exhaustive(error);
    }
};

export const describeLeftover = (reason: LeftoverReason): string => {
    switch (reason) {
        case 'unconfirmed':
            return 'not confirmed yet';
        case 'immature-coinbase':
            return 'mining reward that cannot be spent yet';
        case 'uneconomic':
            return 'worth less than the fee for spending it';
        case 'insufficient-for-fee':
            return 'too small to pay for a transaction';
        default:
            return exhaustive(reason);
    }
};

export const describeSweepStatus = (status: SweepStatus): string => {
    switch (status) {
        case 'confirmed':
            return 'Confirmed';
        case 'pending':
            return 'Waiting for the first confirmation';
        case 'not-in-mempool':
            return 'Not in the network. The coins are unspent again.';
        case 'spent-by-another-transaction':
            return 'The coins were spent by a different transaction';
        case 'unknown':
            return 'Status unclear, waiting for the server';
        default:
            return exhaustive(status);
    }
};
