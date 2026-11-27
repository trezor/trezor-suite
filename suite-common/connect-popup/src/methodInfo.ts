import TrezorConnect, {
    type BitcoinNetworkInfo,
    type CoinInfo,
    type DerivationPath,
    type MethodPermission,
    type PermissionRequest,
    asCoinSymbol,
} from '@trezor/connect';
import { type connectPublicCallableMethods } from '@trezor/connect-common/src/callableMethods';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { type GetCoinInfo } from '@trezor/connect-common/src/types/api/account/getCoinInfo';
import { validatePath } from '@trezor/connect-common/src/utils/pathUtils';

import { getAccountNumber, getNetworkLabel, getUniqueNetworks } from './methodTitles';

// Helpers of the flows describing the calls of hosts. The coins of a call are resolved by Connect,
// the same way its methods resolve them.

/** Describes a host call: its title and its permissions. */
export type MethodInfo = {
    requiredPermissions: PermissionRequest[];
    info: string;
};

/** Calls running under Suite's own firmware update, discovery or coinjoin authorization. */
export const SUITE_ONLY_METHODS = [
    'firmwareUpdate',
    'discoverAccounts',
    'authorizeCoinjoin',
    'cancelCoinjoinAuthorization',
] as const;

export type HostMethod = Exclude<
    (typeof connectPublicCallableMethods)[number],
    (typeof SUITE_ONLY_METHODS)[number]
>;

const getCoinInfo = async (params: GetCoinInfo) => {
    const response = await TrezorConnect.getCoinInfo(params);

    return response.success ? response.payload : undefined;
};

// Like the methods taking any known coin, which Connect rejects as unknown otherwise.
export const getKnownCoinInfo = async (coin: string) => {
    const coinInfo = await getCoinInfo({ coin });
    if (!coinInfo) throw TypedError('Method_UnknownCoin');

    return coinInfo;
};

const isBitcoinNetwork = (coinInfo?: CoinInfo): coinInfo is BitcoinNetworkInfo =>
    coinInfo?.type === 'bitcoin';

// Like the bitcoin methods, a bitcoin `coin` takes precedence over the network of the path.
export const getBitcoinCoinInfo = async (coin?: string, path?: DerivationPath) => {
    const coinInfo = coin ? await getCoinInfo({ coin }) : undefined;
    if (isBitcoinNetwork(coinInfo)) return coinInfo;

    const pathCoinInfo = path ? await getCoinInfo({ path, networkType: 'bitcoin' }) : undefined;

    return isBitcoinNetwork(pathCoinInfo) ? pathCoinInfo : undefined;
};

export const getEthereumCoinInfo = (path: DerivationPath) =>
    getCoinInfo({ path, networkType: 'ethereum' });

// The requests of a call, given as a bundle or by the params themselves.
export const getRequests = <T>(params: { bundle: T[] } | (T & { bundle?: undefined })): T[] =>
    params.bundle ? params.bundle : [params];

export const getBitcoinCoinInfos = (requests: { coin?: string; path?: DerivationPath }[]) =>
    Promise.all(requests.map(({ coin, path }) => getBitcoinCoinInfo(coin, path)));

export const getEthereumCoinInfos = (requests: { path: DerivationPath }[]) =>
    Promise.all(requests.map(({ path }) => getEthereumCoinInfo(path)));

// One permission per coin of the call; the requests of no coin share a single coin-less one.
export const getCoinPermissions = (
    permission: MethodPermission,
    coinInfos: (CoinInfo | undefined)[],
): PermissionRequest[] => {
    const coins = new Set(
        coinInfos.map(coinInfo => coinInfo && asCoinSymbol(coinInfo.shortcut.toLowerCase())),
    );

    return [...coins].map(coin => (coin ? { permission, coin } : { permission }));
};

export const describeCall = (
    info: string,
    requiredPermissions: PermissionRequest[] = [],
): MethodInfo => ({
    info,
    requiredPermissions,
});

// A call of a network whose coin does not depend on the params.
export const describeMiscCall = (coin: string, permission: MethodPermission, info: string) =>
    describeCall(info, [{ permission, coin: asCoinSymbol(coin) }]);

type GetMultipleLabelParams = {
    networks: (CoinInfo | undefined)[];
    getLabelOfNetwork: (label: string, network?: CoinInfo) => string;
    single: string;
    multipleOfNetwork: string;
    multiple: string;
};

export const getMultipleLabel = ({
    networks,
    getLabelOfNetwork,
    single,
    multipleOfNetwork,
    multiple,
}: GetMultipleLabelParams) => {
    if (networks.length === 1) return getLabelOfNetwork(single, networks[0]);

    const [network, ...otherNetworks] = getUniqueNetworks(networks);

    return network && !otherNetworks.length
        ? getLabelOfNetwork(multipleOfNetwork, network)
        : multiple;
};

type PathRequests =
    { bundle: { path: DerivationPath }[] } | { path: DerivationPath; bundle?: undefined };

export const getPaths = (params: PathRequests) => getRequests(params).map(({ path }) => path);

// Names a single account by its number, multiple ones by what is exported of them.
const getExportLabel = (paths: DerivationPath[], single: string, multiple: string) => {
    const [path, ...otherPaths] = paths;

    return path && !otherPaths.length
        ? `Export ${single} for account #${getAccountNumber(validatePath(path))}`
        : `Export multiple ${multiple}`;
};

export const describeMiscAddresses = (coin: string, coinName: string, paths: DerivationPath[]) =>
    describeMiscCall(
        coin,
        'read_address',
        getExportLabel(paths, `${coinName} address`, `${coinName} addresses`),
    );

export const describeMiscPublicKeys = (coin: string, coinName: string, paths: DerivationPath[]) =>
    describeMiscCall(
        coin,
        'read_xpub',
        getExportLabel(paths, `${coinName} public key`, `${coinName} public keys`),
    );

export const describeEthereumSigning = async (path: DerivationPath, label: string) => {
    const network = await getEthereumCoinInfo(path);

    return describeCall(getNetworkLabel(label, network), getCoinPermissions('sign', [network]));
};
