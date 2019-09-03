import { Discovery, PartialDiscovery, STATUS } from '@wallet-reducers/discoveryReducer';
import TrezorConnect, { AccountInfo, UI } from 'trezor-connect';
import { add as addNotification } from '@suite-actions/notificationActions';
import { ACCOUNT, DISCOVERY } from './constants';
import { NETWORKS } from '@suite-config';
import { Dispatch, GetState } from '@suite-types';

export type DiscoveryActions =
    | { type: typeof DISCOVERY.START; payload: Discovery }
    | { type: typeof DISCOVERY.UPDATE; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.FAILED; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.STOP; payload: PartialDiscovery }
    | { type: typeof DISCOVERY.COMPLETE; payload: PartialDiscovery };

type UpdateActionType =
    | typeof DISCOVERY.UPDATE
    | typeof DISCOVERY.FAILED
    | typeof DISCOVERY.STOP
    | typeof DISCOVERY.COMPLETE;

interface DiscoveryItem {
    // trezor-connect
    path: string;
    coin: string;
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    // wallet
    index: number;
    accountType: 'normal' | 'segwit' | 'legacy';
    networkType: 'bitcoin' | 'ripple' | 'ethereum';
}

// trezor-connect untyped event
interface ProgressEvent {
    progress: number;
    response: AccountInfo;
    error?: string;
}

const LIMIT = 10;
const BUNDLE_SIZE = 1;

// Get discovery process for currently selected device.
// Return new instance if not exists
const getDiscovery = (id: string) => (_dispatch: Dispatch, getState: GetState): Discovery => {
    const { discovery } = getState().wallet;
    return (
        discovery.find(d => d.device === id) || {
            device: id,
            index: -1,
            status: STATUS.IDLE,
            // total: (LIMIT + BUNDLE_SIZE) * accountTypes.length,
            total: LIMIT * NETWORKS.length,
            loaded: 0,
            failed: [],
        }
    );
};

const getDiscoveryForDevice = () => (dispatch: Dispatch, getState: GetState) => {
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

const handleProgress = (event: ProgressEvent, device: string, item: DiscoveryItem) => (
    dispatch: Dispatch,
) => {
    // get fresh discovery data
    const discovery = dispatch(getDiscovery(device));
    const { response, error } = event;
    const indexBeyondLimit = item.index + 1 >= LIMIT;
    let { total } = discovery;
    if (error || response.empty) {
        total -= indexBeyondLimit ? 0 : LIMIT - item.index - 1;
    } else if (indexBeyondLimit) {
        // index is beyond limit, increment total value since next account will be loaded
        total += 1;
    }

    if (error) {
        total -= 1; // reduce total since this one will not be counted as "loaded"
        dispatch(
            update(
                {
                    device,
                    total,
                    index: item.index,
                    status: STATUS.RUNNING,
                    failed: discovery.failed.concat([
                        {
                            network: item.coin,
                            accountType: item.accountType,
                            error,
                        },
                    ]),
                },
                DISCOVERY.FAILED,
            ),
        );
        return;
    }

    dispatch(
        update({
            device,
            index: item.index,
            status: STATUS.RUNNING,
            loaded: discovery.loaded + 1,
            total,
        }),
    );

    dispatch({
        type: ACCOUNT.CREATE,
        payload: {
            index: item.index,
            accountType: item.accountType,
            path: item.path,
            networkType: item.networkType,
            network: item.coin,
            ...response,
        },
    });
};

const getBundle = (discovery: Discovery) => (
    _dispatch: Dispatch,
    getState: GetState,
): DiscoveryItem[] => {
    const bundle: DiscoveryItem[] = [];
    // find not empty accounts
    const { accounts } = getState().wallet;
    const usedAccounts = accounts.filter(
        account => account.index === discovery.index && !account.empty,
    );

    NETWORKS.forEach(configNetwork => {
        // check if previous account of requested type already exists
        const accountType = configNetwork.accountType || 'normal';
        const prevAccount = usedAccounts.find(
            account =>
                account.accountType === accountType && account.network === configNetwork.symbol,
        );

        // check if requested coin not failed before
        const failed = discovery.failed.find(
            account =>
                account.network === configNetwork.symbol && account.accountType === accountType,
        );

        const skip = failed || (discovery.index >= 0 && !prevAccount);
        for (let i = 1; i <= BUNDLE_SIZE; i++) {
            const accountIndex = discovery.index + 1;
            // check if this account wasn't created before
            const existedAccount = accounts.find(
                account =>
                    account.accountType === accountType &&
                    account.network === configNetwork.symbol &&
                    account.index === accountIndex,
            );
            if (!skip && !existedAccount) {
                bundle.push({
                    path: configNetwork.bip44.replace('i', accountIndex.toString()),
                    coin: configNetwork.symbol,
                    details: 'txs',
                    index: accountIndex,
                    accountType,
                    networkType: configNetwork.networkType || 'bitcoin',
                });
            }
        }
    });

    // sort by index
    // bundle = bundle.sort((a, b) => a.index - b.index);

    return bundle;
};

export const start = () => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // TODO:
    // - catch interruption and TrezorConnect error
    // - check id discovery is completed
    // - check if there are enough empty accounts loaded
    // - add subscriptions
    // - add progress, estimate how many accounts will be loaded vs. how much i already have
    // - filter coin by firmware (ex: xrp on T1)
    // - if currently load account is selected perform full transaction discovery?

    const selectedDevice = getState().suite.device;
    const discovery = dispatch(getDiscoveryForDevice());
    if (!selectedDevice || !discovery) {
        dispatch(
            // TODO: notification with translations
            addNotification({
                variant: 'error',
                title: 'No device',
                cancelable: true,
            }),
        );
        return;
    } // TODO: throw error in notification?
    const { device } = discovery;

    // start process
    if (discovery.status === STATUS.IDLE) {
        await dispatch({
            type: DISCOVERY.START,
            payload: {
                ...discovery,
                status: STATUS.STARTING,
            },
        });
    }

    // prepare bundle of accounts to discover
    const bundle = dispatch(getBundle(discovery));

    // discovery process complete
    if (bundle.length === 0) {
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
        dispatch(
            update(
                {
                    device,
                    status: STATUS.COMPLETED,
                },
                DISCOVERY.COMPLETE,
            ),
        );
        return;
    }

    // handle trezor-connect event
    const onBundleProgress = (event: ProgressEvent) => {
        const { progress } = event;
        // pass more parameters to handler
        dispatch(handleProgress(event, device, bundle[progress]));
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
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
    });
    TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

    // process response
    if (result.success) {
        if (dispatch(getDiscovery(device)).status === STATUS.RUNNING) {
            await dispatch(start()); // try next index
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
                    throw new Error(
                        `Unexpected JSON error response from TrezorConnect: ${result.payload.error}`,
                    );
                }
                const failed: Discovery['failed'] = coins.map(c => ({
                    network: c.coin,
                    accountType: bundle[c.index].accountType,
                    error: c.exception,
                    fwException: c.exception,
                }));

                // add failed coins to discovery
                dispatch(
                    update({ device, failed, total: discovery.total - LIMIT * failed.length }),
                );

                await dispatch(start()); // restart process, exclude failed coins
                return;
            } catch (error) {
                // do nothing. error will be handled later
            }
        }

        if (result.payload.error === 'discovery_interrupted') {
            // if interruption comes from the user then device session should be released
            await TrezorConnect.getFeatures({
                device: getState().suite.device,
                keepSession: false,
            });
            dispatch(update({ device, status: STATUS.STOPPED }, DISCOVERY.STOP));
            // TODO: notification with translations
            dispatch(
                addNotification({
                    variant: 'error',
                    title: 'Reading accounts error',
                    cancelable: true,
                }),
            );
        } else {
            // call getFeatures to release device session
            // await TrezorConnect.getFeatures({ keepSession: false });
            // discovery failed
            // TODO: reduce index to "start"
            // handle
            dispatch(update({ device, status: STATUS.STOPPED }, DISCOVERY.STOP));
            // TODO: notification with translations
            dispatch(
                addNotification({
                    variant: 'error',
                    title: 'Reading accounts error',
                    // message: (<>{result.payload.error}</>),
                    cancelable: true,
                }),
            );
        }
    }
};

/*
export const init = () => async (dispatch: Dispatch): Promise<void> => {
    const discovery = dispatch(getDiscoveryForDevice());
    if (discovery && discovery.status === STATUS.IDLE) {
        dispatch(start());
    }
};
*/

export const stop = () => async (dispatch: Dispatch): Promise<void> => {
    const discovery = dispatch(getDiscoveryForDevice());
    if (discovery) {
        dispatch(update({ device: discovery.device, status: STATUS.STOPPING }));
        TrezorConnect.cancel('discovery_interrupted');
    }
};
