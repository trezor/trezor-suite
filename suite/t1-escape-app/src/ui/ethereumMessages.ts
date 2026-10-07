import { exhaustive } from '@trezor/type-utils';

import { describeDeviceCallError, describeWalletKind } from './messages';
import type { EthereumTransferError } from '../app/migrationState';
import type { EthereumDiscoveryError } from '../discovery/discoverEthereumAddresses';
import type { EthereumDestinationError } from '../ethereum/ethereumDestination';
import type { EthereumSweepStatus } from '../migration/ethereumSweepStatus';

export { describeWalletKind };

export const describeEthereumDiscoveryError = (error: EthereumDiscoveryError): string => {
    switch (error.type) {
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

export const describeEthereumDestinationError = (error: EthereumDestinationError): string => {
    switch (error.type) {
        case 'empty':
            return 'Enter the address the coins should go to.';
        case 'invalid':
            return 'This is not a valid address. It starts with 0x and has 40 more characters.';
        case 'bad-checksum':
            return 'The capital letters in this address do not match its checksum, so a character is probably wrong. Copy the address from your new wallet again.';
        case 'own-address':
            return 'This address belongs to the old wallet on this Trezor. Enter a receive address of your new wallet.';
        default:
            return exhaustive(error);
    }
};

export const describeEthereumTransferError = (error: EthereumTransferError): string => {
    switch (error.type) {
        case 'broadcast-failed':
            return `The transaction was not accepted for broadcast (${error.message}). It is signed and stored on this page: try again, or export it. It will not be signed a second time.`;
        case 'invalid-backend-data':
            return `The blockchain server returned an unusable ${error.field}. Nothing was signed. Wait a few minutes and try again.`;
        case 'gas-price-too-high':
            return 'The network fee is above the limit this tool accepts right now. Nothing was signed. Try again later, when the network is calmer.';
        case 'plan-already-attempted':
            return 'This transfer was already sent to the Trezor once. A new one was prepared.';
        case 'nonce-already-signed':
            return 'A signed transaction for this address already exists. It can only be broadcast again.';
        case 'account-changed':
            return 'The address changed on the network since the transfer was prepared. Nothing was signed. A new transfer was prepared.';
        case 'address-mismatch':
            return 'The Trezor now holds a different wallet than the one that was scanned. Nothing was signed. Reload the page and start again.';
        case 'unexpected-data-request':
            return 'The Trezor asked for transaction data, which a plain transfer has none of. Nothing was signed.';
        case 'signed-transaction-invalid':
            return `The signature returned by the Trezor does not produce the prepared transaction (${error.reason}). It was discarded.`;
        case 'address-invalid':
            return 'The Trezor returned something that is not an address. Nothing was signed.';
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

export const describeEthereumSweepStatus = (status: EthereumSweepStatus): string => {
    switch (status) {
        case 'confirmed':
            return 'Confirmed';
        case 'pending':
            return 'Waiting for the first confirmation';
        case 'not-in-mempool':
            return 'Not in the network. The coins are still on the old device.';
        case 'failed':
            return 'Mined but failed. The fee was spent, the coins are still on the old device.';
        case 'unknown':
            return 'Status unclear, waiting for the server';
        default:
            return exhaustive(status);
    }
};
