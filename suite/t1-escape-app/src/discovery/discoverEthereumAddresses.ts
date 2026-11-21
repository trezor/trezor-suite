import { type Result, ok } from '@trezor/type-utils';

import { diagnosticLog } from '../app/diagnosticLog';
import type { BackendError, EthereumBackend } from '../backend/backend';
import type { DeviceCall } from '../device/deviceSession';
import { type EthereumAddressError, getEthereumAddress } from '../device/ethereumAddress';
import type { EthereumAccount } from '../ethereum/ethereumAccount';
import { type EthereumAddressInfo, toEthereumAddressInfo } from '../ethereum/ethereumAccountInfo';
import {
    ETHEREUM_CHAIN_DEFINITIONS,
    type EthereumChain,
    getEthereumAddressPath,
} from '../ethereum/ethereumChain';

/** Hard stop for the automatic walk of one path family. */
export const MAX_AUTOMATIC_ETHEREUM_ADDRESSES = 20;

/** Number of further addresses scanned per path family by "scan more addresses". */
export const SCAN_MORE_ETHEREUM_ADDRESSES_STEP = 5;

export type EthereumScannedAddress = {
    account: EthereumAccount;
    info: EthereumAddressInfo;
    /** No transaction, nothing pending and no balance. */
    isEmpty: boolean;
};

export type EthereumDiscoveryError = EthereumAddressError | BackendError;

export type ScanEthereumAddressParams = {
    call: DeviceCall;
    backend: EthereumBackend;
    chain: EthereumChain;
    slip44: number;
    index: number;
};

/** Scans one address: the address comes from the device, its state from the backend. */
export const scanEthereumAddress = async ({
    call,
    backend,
    chain,
    slip44,
    index,
}: ScanEthereumAddressParams): Promise<Result<EthereumScannedAddress, EthereumDiscoveryError>> => {
    diagnosticLog.info('discovery', 'scanning address', { chain, slip44, index });
    const path = getEthereumAddressPath(slip44, index);

    const address = await getEthereumAddress({ call, path });
    if (!address.success) {
        diagnosticLog.error('discovery', 'address not read', address.error);

        return address;
    }

    const accountInfo = await backend.getAccountInfo(address.payload);
    if (!accountInfo.success) return accountInfo;

    const info = toEthereumAddressInfo(accountInfo.payload);
    diagnosticLog.info('discovery', 'address scanned', {
        chain,
        slip44,
        index,
        isEmpty: info.isEmpty,
        transactions: info.transactions,
        unconfirmed: info.unconfirmedTransactions,
        hasBalance: info.balance !== '0',
        tokens: info.tokens.length,
    });

    return ok({
        account: { chain, slip44, index, path, address: address.payload },
        info,
        isEmpty: info.isEmpty,
    });
};

export type ScanEthereumAddressRangeParams = Omit<ScanEthereumAddressParams, 'index'> & {
    firstIndex: number;
    /** Number of addresses to scan when `stopAtFirstEmpty` is not set. */
    count: number;
    /** Standard discovery: stop after the first address that was never used. */
    stopAtFirstEmpty: boolean;
    onAddressScanned?: (address: EthereumScannedAddress) => void;
};

/** Scans consecutive addresses of one path family. The empty address ending the walk is included. */
export const scanEthereumAddressRange = async ({
    firstIndex,
    count,
    stopAtFirstEmpty,
    onAddressScanned,
    ...params
}: ScanEthereumAddressRangeParams): Promise<
    Result<EthereumScannedAddress[], EthereumDiscoveryError>
> => {
    const scanned: EthereumScannedAddress[] = [];

    for (let offset = 0; offset < count; offset++) {
        const result = await scanEthereumAddress({ ...params, index: firstIndex + offset });
        if (!result.success) return result;

        scanned.push(result.payload);
        onAddressScanned?.(result.payload);

        if (stopAtFirstEmpty && result.payload.isEmpty) break;
    }

    return ok(scanned);
};

export type ScanEthereumPathFamiliesParams = Pick<
    ScanEthereumAddressRangeParams,
    'call' | 'backend' | 'chain' | 'onAddressScanned'
>;

/** The standard discovery of a chain: every path family from index 0 to the first unused address. */
export const scanEthereumPathFamilies = async ({
    chain,
    ...params
}: ScanEthereumPathFamiliesParams): Promise<
    Result<EthereumScannedAddress[], EthereumDiscoveryError>
> => {
    const addresses: EthereumScannedAddress[] = [];

    for (const slip44 of ETHEREUM_CHAIN_DEFINITIONS[chain].slip44s) {
        const scanned = await scanEthereumAddressRange({
            ...params,
            chain,
            slip44,
            firstIndex: 0,
            count: MAX_AUTOMATIC_ETHEREUM_ADDRESSES,
            stopAtFirstEmpty: true,
        });
        if (!scanned.success) return scanned;

        addresses.push(...scanned.payload);
    }

    return ok(addresses);
};

/** True when no scanned address has ever been used. Decides the raw-passphrase fallback. */
export const isEthereumWalletEmpty = (addresses: readonly EthereumScannedAddress[]) =>
    addresses.every(({ isEmpty }) => isEmpty);
