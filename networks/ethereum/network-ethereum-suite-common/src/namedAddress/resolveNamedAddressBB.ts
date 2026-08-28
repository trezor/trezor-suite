import TrezorConnect from '@trezor/connect';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

/**
 * Forward-resolve a named input (ENS or other TLD) to its onchain address via Blockbook.
 *
 * Blockbook accepts the name as the account `descriptor` and returns the resolved hex
 * address back on `payload.descriptor` (see the descriptor override in
 * `@trezor/connect` getAccountInfo). We request `details: 'basic'` since we only need
 * the resolved descriptor, not the account's transaction history.
 *
 * @param value - ENS name or other TLD name.
 * @param symbol - Network symbol the name should be resolved on (e.g. `eth`).
 * @returns The resolved onchain address.
 */
export const resolveViaBlockbook = async (value: string, symbol: EthereumNetworkSymbol) => {
    const result = await TrezorConnect.getAccountInfo({
        descriptor: value,
        coin: symbol,
        details: 'basic',
    });

    if (!result.success) {
        throw new Error(result.error.message);
    }

    return result.payload.descriptor;
};
