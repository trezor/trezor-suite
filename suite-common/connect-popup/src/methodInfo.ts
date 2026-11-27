import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import TrezorConnect, {
    type BitcoinNetworkInfo,
    type CallMethodParams,
    type CallMethodPayload,
    type CoinInfo,
    type DerivationPath,
    type MethodPermission,
    type PermissionRequest,
    asCoinSymbol,
} from '@trezor/connect';
import { type connectPublicCallableMethods } from '@trezor/connect-common/src/callableMethods';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { type GetCoinInfo } from '@trezor/connect-common/src/types/api/account/getCoinInfo';
import { getLabel, validatePath } from '@trezor/connect-common/src/utils/pathUtils';
import { BigNumber } from '@trezor/utils';

import {
    formatAmount,
    getAccountNumber,
    getNetworkLabel,
    getPublicKeyLabel,
    getUniqueNetworks,
} from './methodTitles';

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

type HostMethod = Exclude<
    (typeof connectPublicCallableMethods)[number],
    (typeof SUITE_ONLY_METHODS)[number]
>;

type DescribeCall<M extends HostMethod> = (
    params: CallMethodParams<M>,
) => MethodInfo | Promise<MethodInfo>;

const getCoinInfo = async (params: GetCoinInfo) => {
    const response = await TrezorConnect.getCoinInfo(params);

    return response.success ? response.payload : undefined;
};

// Like the methods taking any known coin, which Connect rejects as unknown otherwise.
const getKnownCoinInfo = async (coin: string) => {
    const coinInfo = await getCoinInfo({ coin });
    if (!coinInfo) throw TypedError('Method_UnknownCoin');

    return coinInfo;
};

const isBitcoinNetwork = (coinInfo?: CoinInfo): coinInfo is BitcoinNetworkInfo =>
    coinInfo?.type === 'bitcoin';

// Like the bitcoin methods, a bitcoin `coin` takes precedence over the network of the path.
const getBitcoinCoinInfo = async (coin?: string, path?: DerivationPath) => {
    const coinInfo = coin ? await getCoinInfo({ coin }) : undefined;
    if (isBitcoinNetwork(coinInfo)) return coinInfo;

    const pathCoinInfo = path ? await getCoinInfo({ path, networkType: 'bitcoin' }) : undefined;

    return isBitcoinNetwork(pathCoinInfo) ? pathCoinInfo : undefined;
};

const getEthereumCoinInfo = (path: DerivationPath) =>
    getCoinInfo({ path, networkType: 'ethereum' });

// The requests of a call, given as a bundle or by the params themselves.
const getRequests = <T>(params: { bundle: T[] } | (T & { bundle?: undefined })): T[] =>
    params.bundle ? params.bundle : [params];

const getBitcoinCoinInfos = (requests: { coin?: string; path?: DerivationPath }[]) =>
    Promise.all(requests.map(({ coin, path }) => getBitcoinCoinInfo(coin, path)));

const getEthereumCoinInfos = (requests: { path: DerivationPath }[]) =>
    Promise.all(requests.map(({ path }) => getEthereumCoinInfo(path)));

// One permission per coin of the call; the requests of no coin share a single coin-less one.
const getCoinPermissions = (
    permission: MethodPermission,
    coinInfos: (CoinInfo | undefined)[],
): PermissionRequest[] => {
    const coins = new Set(
        coinInfos.map(coinInfo => coinInfo && asCoinSymbol(coinInfo.shortcut.toLowerCase())),
    );

    return [...coins].map(coin => (coin ? { permission, coin } : { permission }));
};

const describeCall = (info: string, requiredPermissions: PermissionRequest[] = []): MethodInfo => ({
    info,
    requiredPermissions,
});

// A call of a network whose coin does not depend on the params.
const describeMiscCall = (coin: string, permission: MethodPermission, info: string) =>
    describeCall(info, [{ permission, coin: asCoinSymbol(coin) }]);

type GetMultipleLabelParams = {
    networks: (CoinInfo | undefined)[];
    getLabelOfNetwork: (label: string, network?: CoinInfo) => string;
    single: string;
    multipleOfNetwork: string;
    multiple: string;
};

const getMultipleLabel = ({
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

const getPaths = (params: PathRequests) => getRequests(params).map(({ path }) => path);

// Names a single account by its number, multiple ones by what is exported of them.
const getExportLabel = (paths: DerivationPath[], single: string, multiple: string) => {
    const [path, ...otherPaths] = paths;

    return path && !otherPaths.length
        ? `Export ${single} for account #${getAccountNumber(validatePath(path))}`
        : `Export multiple ${multiple}`;
};

const describeMiscAddresses = (coin: string, coinName: string, paths: DerivationPath[]) =>
    describeMiscCall(
        coin,
        'read_address',
        getExportLabel(paths, `${coinName} address`, `${coinName} addresses`),
    );

const describeMiscPublicKeys = (coin: string, coinName: string, paths: DerivationPath[]) =>
    describeMiscCall(
        coin,
        'read_xpub',
        getExportLabel(paths, `${coinName} public key`, `${coinName} public keys`),
    );

const describeEthereumSigning = async (path: DerivationPath, label: string) => {
    const network = await getEthereumCoinInfo(path);

    return describeCall(getNetworkLabel(label, network), getCoinPermissions('sign', [network]));
};

const DESCRIBE_CALL: { [M in HostMethod]: DescribeCall<M> } = {
    // device
    getFeatures: () => describeCall('', [{ permission: 'read_features' }]),
    getDeviceState: () => describeCall('', [{ permission: 'read_features' }]),
    showDeviceTutorial: () => describeCall('Show device tutorial'),
    requestLogin: () => describeCall('Login', [{ permission: 'sign' }]),
    cipherKeyValue: () => describeCall('Cipher key value', [{ permission: 'sign' }]),
    unlockPath: () => describeCall('', [{ permission: 'read_xpub' }]),
    getOwnershipId: async params => {
        const requests = getRequests(params);
        const coinInfos = await getBitcoinCoinInfos(requests);

        return describeCall(
            requests.length > 1 ? 'Export multiple ownership proof ids' : 'Export ownership id',
            getCoinPermissions('read_account_info', coinInfos),
        );
    },
    getOwnershipProof: async params => {
        const requests = getRequests(params);
        const coinInfos = await getBitcoinCoinInfos(requests);
        // Preauthorized proofs run under the coinjoin authorization of the device session.
        const isPreauthorized = requests.some(({ preauthorized }) => preauthorized);

        return describeCall(
            requests.length > 1 ? 'Export multiple ownership proofs' : 'Export ownership proof',
            getCoinPermissions('read_account_info', coinInfos).concat(
                isPreauthorized ? getCoinPermissions('internal', coinInfos) : [],
            ),
        );
    },
    // blockchain
    pushTransaction: async ({ coin }) =>
        describeCall('', getCoinPermissions('push_tx', [await getKnownCoinInfo(coin)])),
    // account
    getAddress: async params => {
        const requests = getRequests(params);
        const coinInfos = await getBitcoinCoinInfos(requests);

        return describeCall(
            getMultipleLabel({
                networks: coinInfos,
                getLabelOfNetwork: getLabel,
                single: 'Export #NETWORK address',
                multipleOfNetwork: 'Export multiple #NETWORK addresses',
                multiple: 'Export multiple addresses',
            }),
            getCoinPermissions('read_address', coinInfos),
        );
    },
    getPublicKey: async params => {
        const requests = getRequests(params);
        // A path of no bitcoin network asks for a coin-less permission.
        const coinInfos = await getBitcoinCoinInfos(requests);
        const [request] = requests;
        const [coinInfo] = coinInfos;
        const info =
            requests.length > 1 || !request
                ? 'Export multiple public keys'
                : getPublicKeyLabel({
                      path: validatePath(request.path),
                      coinInfo,
                      coinName: coinInfo
                          ? ''
                          : ((await getEthereumCoinInfo(request.path))?.name ?? 'Unknown coin'),
                  });

        return describeCall(info, getCoinPermissions('read_xpub', coinInfos));
    },
    getAccountInfo: async params => {
        const requests = getRequests(params);
        const coinInfos = await Promise.all(requests.map(({ coin }) => getKnownCoinInfo(coin)));
        const [coinInfo] = coinInfos;

        return describeCall(
            requests.length > 1
                ? 'Export info of multiple accounts'
                : getLabel('Export #NETWORK account info', coinInfo),
            getCoinPermissions('read_account_info', coinInfos),
        );
    },
    selectAccount: async ({ coin, addressSelection }) => {
        const coinInfo = await getKnownCoinInfo(coin);
        // UTXO coins share the whole account as an xpub unless the host picks its addresses.
        const isUtxoBased =
            coinInfo.type === 'bitcoin' ||
            coinInfo.shortcut === 'ADA' ||
            coinInfo.shortcut === 'tADA';
        const isFullAccount = addressSelection === undefined || addressSelection === 'fullAccount';

        return describeCall(
            getLabel('Select #NETWORK account', coinInfo),
            getCoinPermissions(isUtxoBased && isFullAccount ? 'read_xpub' : 'read_address', [
                coinInfo,
            ]),
        );
    },
    signMessage: async ({ coin, path }) => {
        const coinInfo = await getBitcoinCoinInfo(coin, path);

        return describeCall(
            getLabel('Sign #NETWORK message', coinInfo),
            getCoinPermissions('sign_message', [coinInfo]),
        );
    },
    verifyMessage: async ({ coin }) => {
        const coinInfo = await getBitcoinCoinInfo(coin);

        return describeCall(
            getLabel('Verify #NETWORK message', coinInfo),
            getCoinPermissions('verify_message', [coinInfo]),
        );
    },
    getCoinInfo: () => describeCall(''),
    // bitcoin
    sendTransaction: async ({ coin, outputs, push }) => {
        const coinInfo = await getBitcoinCoinInfo(coin);
        const total = outputs.reduce(
            (sum, output) =>
                'amount' in output && typeof output.amount === 'string'
                    ? sum.plus(output.amount)
                    : sum,
            new BigNumber(0),
        );
        const info = outputs.some(output => output.type === 'send-max')
            ? 'Send maximum amount'
            : `Send ${coinInfo ? formatAmount(total.toString(), coinInfo) : total.toString()}`;

        return describeCall(
            info,
            getCoinPermissions('sign', [coinInfo]).concat(
                push ? getCoinPermissions('push_tx', [coinInfo]) : [],
            ),
        );
    },
    signTransaction: async ({ coin, push, preauthorized }) => {
        const coinInfo = await getBitcoinCoinInfo(coin);

        return describeCall(
            getLabel('Sign #NETWORK transaction', coinInfo),
            getCoinPermissions('sign', [coinInfo]).concat(
                push ? getCoinPermissions('push_tx', [coinInfo]) : [],
                // Preauthorized signing runs under the coinjoin authorization of the device session.
                preauthorized ? getCoinPermissions('internal', [coinInfo]) : [],
            ),
        );
    },
    composePsbt: () => describeCall('Compose PSBT transaction'),
    composeTransaction: () => describeCall('Compose transaction'),
    // ethereum
    ethereumGetAddress: async params => {
        const networks = await getEthereumCoinInfos(getRequests(params));

        return describeCall(
            getMultipleLabel({
                networks,
                getLabelOfNetwork: getNetworkLabel,
                single: 'Export #NETWORK address',
                multipleOfNetwork: 'Export multiple #NETWORK addresses',
                multiple: 'Export multiple addresses',
            }),
            getCoinPermissions('read_address', networks),
        );
    },
    ethereumGetPublicKey: async params => {
        const networks = await getEthereumCoinInfos(getRequests(params));

        return describeCall(
            getMultipleLabel({
                networks,
                getLabelOfNetwork: getNetworkLabel,
                single: 'Export #NETWORK public key',
                multipleOfNetwork: 'Export multiple #NETWORK public keys',
                multiple: 'Export multiple public keys',
            }),
            getCoinPermissions('read_xpub', networks),
        );
    },
    ethereumSignTransaction: async ({ path, transaction }) => {
        const network = await getEthereumCoinInfo(path);

        return describeCall(
            // The chain of the transaction names the network better than its path.
            getNetworkLabel(
                'Sign #NETWORK transaction',
                getNetworkByEvmChainId(transaction.chainId) ?? network,
            ),
            getCoinPermissions('sign', [network]),
        );
    },
    ethereumSignMessage: ({ path }) => describeEthereumSigning(path, 'Sign #NETWORK message'),
    ethereumSignTypedData: ({ path }) => describeEthereumSigning(path, 'Sign #NETWORK typed data'),
    ethereumVerifyMessage: () => describeCall('Verify message', [{ permission: 'verify_message' }]),
    // cardano
    cardanoGetAddress: params =>
        describeMiscAddresses(
            'ada',
            'Cardano',
            getRequests(params).map(({ addressParameters }) => addressParameters.path ?? []),
        ),
    cardanoGetPublicKey: params => describeMiscPublicKeys('ada', 'Cardano', getPaths(params)),
    cardanoGetNativeScriptHash: () =>
        describeMiscCall('ada', 'read_address', 'Get Cardano native script hash'),
    cardanoSignTransaction: () => describeMiscCall('ada', 'sign', 'Sign Cardano transaction'),
    cardanoSignMessage: () => describeMiscCall('ada', 'sign', 'Sign Cardano message'),
    cardanoComposeTransaction: () => describeCall('Compose Cardano transaction'),
    // monero
    moneroGetAddress: () => describeMiscCall('xmr', 'read_address', 'Export Monero address'),
    moneroGetWatchKey: () =>
        describeMiscCall('xmr', 'read_xpub', 'Export Monero watch-only credentials'),
    moneroKeyImageSync: () =>
        describeMiscCall(
            'xmr',
            'read_account_info',
            'Export Monero key images for spent output tracking',
        ),
    moneroSignTransaction: () => describeMiscCall('xmr', 'sign', 'Sign Monero transaction'),
    // ripple
    rippleGetAddress: params => describeMiscAddresses('xrp', 'Ripple', getPaths(params)),
    rippleSignTransaction: () => describeMiscCall('xrp', 'sign', 'Sign Ripple transaction'),
    // solana
    solanaGetAddress: params => describeMiscAddresses('sol', 'Solana', getPaths(params)),
    solanaGetPublicKey: params => describeMiscPublicKeys('sol', 'Solana', getPaths(params)),
    solanaSignTransaction: () => describeMiscCall('sol', 'sign', 'Sign Solana transaction'),
    solanaSignMessage: () => describeMiscCall('sol', 'sign_message', 'Sign Solana message'),
    solanaComposeTransaction: () => describeCall('Compose Solana transaction'),
    // stellar
    stellarGetAddress: params => describeMiscAddresses('xlm', 'Stellar', getPaths(params)),
    stellarSignTransaction: () => describeMiscCall('xlm', 'sign', 'Sign Stellar transaction'),
    // tron
    tronGetAddress: params => describeMiscAddresses('trx', 'Tron', getPaths(params)),
    tronSignTransaction: () => describeMiscCall('trx', 'sign', 'Sign Tron transaction'),
    tronComposeTransaction: () => describeCall('Compose Tron transaction'),
    // nostr
    nostrGetPublicKey: () => describeMiscCall('nostr', 'read_xpub', 'Export Nostr public key'),
    nostrSignEvent: () => describeMiscCall('nostr', 'sign', 'Sign Nostr event'),
};

// Host apps can send any method name, even a non-string one or one of an inherited property.
const isHostMethod = (method: unknown): method is HostMethod =>
    typeof method === 'string' && Object.hasOwn(DESCRIBE_CALL, method);

/**
 * Describes a call of a host: its title and the permissions it needs. The coins are resolved by
 * Connect, the same way its methods resolve them.
 */
export const getMethodInfo = async (params: CallMethodPayload): Promise<MethodInfo> => {
    const { method } = params;
    if (!isHostMethod(method)) throw TypedError('Method_Unsupported');

    // The entry of a method takes the params of the same method, which TypeScript cannot relate.
    const describe = DESCRIBE_CALL[method] as (
        params: CallMethodPayload,
    ) => ReturnType<DescribeCall<HostMethod>>;

    return await describe(params);
};
