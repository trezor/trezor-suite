import {
    Discovery,
    PartialDiscovery,
    DISCOVERY_STATUS as STATUS,
} from '@wallet-reducers/discoveryReducer';
import TrezorConnect, { AccountInfo, UI } from 'trezor-connect';
import { add as addNotification } from '@suite-actions/notificationActions';
import { create as createAccount } from '@wallet-actions/accountActions';
import { DISCOVERY } from './constants';
import { SETTINGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';

export type DiscoveryActions =
    | { type: typeof DISCOVERY.CREATE; payload: Discovery }
    | { type: typeof DISCOVERY.START; payload: Discovery }
    | { type: typeof DISCOVERY.UPDATE; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.INTERRUPT; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.STOP; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.COMPLETE; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.REMOVE; payload: PartialDiscovery };

type UpdateActionType =
    | typeof DISCOVERY.UPDATE
    | typeof DISCOVERY.INTERRUPT
    | typeof DISCOVERY.STOP
    | typeof DISCOVERY.COMPLETE;

export interface DiscoveryItem {
    // trezor-connect
    path: string;
    coin: Account['symbol'];
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    pageSize?: number;
    // wallet
    index: number;
    accountType: Account['accountType'];
    networkType: Account['networkType'];
}

// TODO: trezor-connect untyped event
interface ProgressEvent {
    progress: number;
    response: AccountInfo;
    error?: string;
}

const LIMIT = 10;

// Get discovery process for deviceState.
const getDiscovery = (deviceState: string) => (
    _dispatch: Dispatch,
    getState: GetState,
): Discovery | undefined => {
    const { discovery } = getState().wallet;
    return discovery.find(d => d.deviceState === deviceState);
};

export const getDiscoveryForDevice = () => (
    dispatch: Dispatch,
    getState: GetState,
): Discovery | undefined => {
    const { device } = getState().suite;
    if (!device || !device.state) return;
    return dispatch(getDiscovery(device.state));
};

export const update = (
    payload: PartialDiscovery,
    type: UpdateActionType = DISCOVERY.UPDATE,
): DiscoveryActions => ({
    type,
    payload,
});

const calculateProgress = (discovery: Discovery) => (
    _dispatch: Dispatch,
    getState: GetState,
): PartialDiscovery => {
    let total = LIMIT * discovery.networks.length;
    let loaded = 0;
    const accounts = getState().wallet.accounts.filter(
        a => a.deviceState === discovery.deviceState,
    );
    accounts.forEach(a => {
        if (discovery.networks.includes(a.symbol)) {
            loaded++;
            const indexBeyondLimit = a.index + 1 >= LIMIT;
            if (a.empty && !a.visible) {
                total -= indexBeyondLimit ? 0 : LIMIT - a.index - 1;
            } else if (indexBeyondLimit) {
                // index is beyond limit, increment total value since next account will be loaded
                total += 1;
            }
        }
    });
    discovery.failed.forEach(f => {
        total -= LIMIT - f.index;
    });
    return {
        deviceState: discovery.deviceState,
        loaded,
        total,
    };
};

const handleProgress = (event: ProgressEvent, deviceState: string, item: DiscoveryItem) => (
    dispatch: Dispatch,
) => {
    // get fresh discovery data
    const discovery = dispatch(getDiscovery(deviceState));
    // ignore progress event when:
    // 1. discovery is not running (interrupted/stopped/complete)
    if (!discovery || discovery.status > STATUS.RUNNING) return;
    // 2. account network is no longer part of discovery (network disabled in wallet settings)
    if (!discovery.networks.includes(item.coin)) return;
    // process event
    const { response, error } = event;
    let { failed } = discovery;
    if (error) {
        failed = failed.concat([
            {
                index: item.index,
                symbol: item.coin,
                accountType: item.accountType,
                error,
            },
        ]);
    } else {
        dispatch(createAccount(deviceState, item, response));
    }
    // calculate progress
    const progress = dispatch(
        calculateProgress({
            ...discovery,
            failed,
        }),
    );
    // update discovery
    dispatch(
        update({
            ...progress,
            bundleSize: discovery.bundleSize - 1,
            failed,
        }),
    );
};

const getBundle = (discovery: Discovery) => (_d: Dispatch, getState: GetState): DiscoveryItem[] => {
    const bundle: DiscoveryItem[] = [];
    // find all accounts
    const accounts = getState().wallet.accounts.filter(
        a => a.deviceState === discovery.deviceState,
    );
    const networks = NETWORKS.filter(n => discovery.networks.includes(n.symbol));
    networks.forEach(configNetwork => {
        // find all existed accounts
        const accountType = configNetwork.accountType || 'normal';
        const prevAccounts = accounts
            .filter(
                account =>
                    account.accountType === accountType && account.symbol === configNetwork.symbol,
            )
            .sort((a, b) => {
                return b.index - a.index;
            });

        // check if requested coin already have an empty account
        const hasEmptyAccount = prevAccounts.find(a => a.empty && !a.visible);
        // check if requested coin not failed before
        const failed = discovery.failed.find(
            account =>
                account.symbol === configNetwork.symbol && account.accountType === accountType,
        );

        if (!hasEmptyAccount && !failed) {
            const index = prevAccounts[0] ? prevAccounts[0].index + 1 : 0;
            bundle.push({
                path: configNetwork.bip44.replace('i', index.toString()),
                coin: configNetwork.symbol,
                details: 'txs',
                index,
                pageSize: SETTINGS.TXS_PER_PAGE,
                accountType,
                networkType: configNetwork.networkType,
            });
        }
    });
    return bundle;
};

export const updateNetworkSettings = () => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    const { discovery } = getState().wallet;
    discovery.forEach(d => {
        const networks = NETWORKS.filter(
            n => enabledNetworks.includes(n.symbol) && !n.isHidden,
        ).map(n => n.symbol);
        const progress = dispatch(
            calculateProgress({
                ...d,
                networks,
                failed: [],
            }),
        );
        dispatch(
            update({
                ...progress,
                networks,
                failed: [],
            }),
        );
    });
};

export const create = (deviceState: string) => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    const networks = NETWORKS.filter(n => enabledNetworks.includes(n.symbol) && !n.isHidden).map(
        n => n.symbol,
    );
    dispatch({
        type: DISCOVERY.CREATE,
        payload: {
            deviceState,
            index: 0,
            status: STATUS.IDLE,
            total: LIMIT * networks.length,
            bundleSize: 0,
            loaded: 0,
            failed: [],
            networks,
        },
    });
};

export const remove = (deviceState: string) => ({
    type: DISCOVERY.REMOVE,
    payload: {
        deviceState,
    },
});

export const start = () => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // TODO:
    // - add subscriptions
    // - filter coin by firmware (ex: xrp on T1)

    const selectedDevice = getState().suite.device;
    const discovery = dispatch(getDiscoveryForDevice());
    if (!selectedDevice || !discovery) {
        dispatch(
            // TODO: notification with translations
            addNotification({
                variant: 'error',
                title: 'No discovery',
                cancelable: true,
            }),
        );
        return;
    } // TODO: throw error in notification?
    const { deviceState } = discovery;

    // start process
    if (discovery.status === STATUS.IDLE || discovery.status > STATUS.STOPPING) {
        dispatch({
            type: DISCOVERY.START,
            payload: {
                ...discovery,
                status: STATUS.RUNNING,
            },
        });
    }

    // prepare bundle of accounts to discover
    const bundle = dispatch(getBundle(discovery));

    // discovery process complete
    if (bundle.length === 0) {
        if (discovery.status === STATUS.RUNNING && selectedDevice.connected) {
            // call getFeatures to release device session
            await TrezorConnect.getFeatures({
                device: {
                    path: selectedDevice.path,
                    instance: selectedDevice.instance,
                    state: selectedDevice.state,
                },
                keepSession: false,
                useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
            });
        }

        dispatch(
            update(
                {
                    deviceState,
                    status: STATUS.COMPLETED,
                },
                DISCOVERY.COMPLETE,
            ),
        );
        return;
    }

    dispatch(update({ deviceState, bundleSize: bundle.length, status: STATUS.RUNNING }));

    // handle trezor-connect event
    const onBundleProgress = (event: ProgressEvent) => {
        const { progress } = event;
        // pass more parameters to handler
        dispatch(handleProgress(event, deviceState, bundle[progress]));
    };

    TrezorConnect.on(UI.BUNDLE_PROGRESS, onBundleProgress);
    const result = await TrezorConnect.getAccountInfo({
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        bundle,
        keepSession: true,
        skipFinalReload: true,
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
    });

    TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

    // process response
    if (result.success) {
        // fetch fresh data from reducer
        const currentDiscovery = dispatch(getDiscovery(deviceState));
        if (!currentDiscovery) return;
        if (currentDiscovery.status === STATUS.RUNNING) {
            await dispatch(start()); // try next index
        } else if (currentDiscovery.status === STATUS.STOPPING) {
            dispatch(update({ deviceState, status: STATUS.STOPPED }, DISCOVERY.STOP));
        } else {
            // TODO: notification with translations
            dispatch(
                addNotification({
                    variant: 'error',
                    title: 'Reading accounts error: Discovery process is not running',
                    // message: (<>{result.payload.error}</>),
                    cancelable: true,
                }),
            );
        }
    } else {
        // this error will be thrown only at the beginning of discovery process
        // it will determine which coins are not supported because one of exceptions below
        // - UI.FIRMWARE_NOT_SUPPORTED
        // - UI.FIRMWARE_NOT_COMPATIBLE
        // - UI.FIRMWARE_OLD
        // those coins should be added to "failed" field
        if (result.payload.code === 'bundle_fw_exception') {
            try {
                const coins: { index: number; coin: string; exception: string }[] = JSON.parse(
                    result.payload.error,
                );
                if (!coins || !Array.isArray(coins)) {
                    // throw error to prevent execution. error will be processed in lower block
                    throw new Error(
                        `Unexpected JSON error response from TrezorConnect: ${result.payload.error}`,
                    );
                }
                const failed: Discovery['failed'] = coins.map(c => ({
                    index: 0,
                    symbol: c.coin,
                    accountType: bundle[c.index].accountType,
                    error: c.exception,
                    fwException: c.exception,
                }));

                const progress = dispatch(
                    calculateProgress({
                        ...discovery,
                        failed,
                    }),
                );

                dispatch(
                    update({
                        ...progress,
                        bundleSize: discovery.bundleSize - failed.length,
                        failed,
                    }),
                );

                await dispatch(start()); // restart process, exclude failed coins
                return;
            } catch (error) {
                // do nothing. error will be handled in lower block
            }
        }

        dispatch(update({ deviceState, status: STATUS.STOPPED }, DISCOVERY.STOP));

        if (result.payload.error !== 'discovery_interrupted') {
            // TODO: notification with translations
            dispatch(
                addNotification({
                    variant: 'error',
                    title: 'Reading accounts error',
                    message: result.payload.error,
                    cancelable: true,
                    actions: [
                        {
                            label: 'Retry',
                            callback: () => dispatch(start()),
                        },
                    ],
                }),
            );
        }
    }
};

export const stop = () => async (dispatch: Dispatch): Promise<void> => {
    const discovery = dispatch(getDiscoveryForDevice());
    if (discovery && discovery.running) {
        dispatch(
            update(
                { deviceState: discovery.deviceState, status: STATUS.STOPPING },
                DISCOVERY.INTERRUPT,
            ),
        );
        TrezorConnect.cancel('discovery_interrupted');

        return discovery.running.promise;
    }
};
