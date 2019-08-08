import TrezorConnect, { UI, AccountInfo } from 'trezor-connect';
import { Dispatch, GetState } from '@suite-types/index';
import { Discovery, PartialDiscovery, STATUS } from '@wallet-reducers/discoveryReducer';
import { ACCOUNT, DISCOVERY } from './constants';

export type DiscoveryActions =
    | {
          type: typeof DISCOVERY.START;
          payload: Discovery;
      }
    | {
          type: typeof DISCOVERY.UPDATE;
          payload: PartialDiscovery;
      }
    | {
          type: typeof DISCOVERY.FAILED;
          payload: PartialDiscovery;
      }
    | {
          type: typeof DISCOVERY.STOP;
          payload: PartialDiscovery;
      }
    | {
          type: typeof DISCOVERY.COMPLETE;
          payload: PartialDiscovery;
      };

type UpdateActionType =
    | typeof DISCOVERY.UPDATE
    | typeof DISCOVERY.FAILED
    | typeof DISCOVERY.STOP
    | typeof DISCOVERY.COMPLETE;

interface AccountType {
    path: string;
    coin: string;
    type?: 'normal' | 'segwit' | 'legacy';
    networkType?: 'bitcoin' | 'ethereum' | 'ripple';
}

interface DiscoveryItem {
    // trezor-connect
    path: string;
    coin: string;
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    // wallet
    index: number;
    type: 'normal' | 'segwit' | 'legacy';
    networkType: 'bitcoin' | 'ethereum' | 'ripple';
}

// trezor-connect untyped event
interface ProgressEvent {
    progress: number;
    response: AccountInfo;
    error?: string;
}

const accountTypes: AccountType[] = [
    { path: "m/84'/0'/i'", coin: 'btc' },
    { path: "m/49'/0'/i'", coin: 'btc', type: 'segwit' },
    { path: "m/44'/0'/i'", coin: 'btc', type: 'legacy' },
    { path: "m/49'/2'/i'", coin: 'ltc' },
    { path: "m/44'/2'/i'", coin: 'ltc', type: 'legacy' },
    // { path: "m/84'/1'/i'", coin: 'test' },
    // { path: "m/49'/1'/i'", coin: 'test', type: 'segwit' },
    // { path: "m/44'/1'/i'", coin: 'test', type: 'legacy' },
    { path: "m/44'/60'/0'/0/i", coin: 'eth', networkType: 'ethereum' },
    { path: "m/44'/61'/0'/0/i", coin: 'etc', networkType: 'ethereum' },
    // { path: "m/44'/60'/0'/0/i", coin: 'trop', networkType: 'ethereum' },
    // { path: "m/44'/144'/i'/0/0", coin: 'xrp', networkType: 'ripple' },
    { path: "m/44'/1'/i'/0/0", coin: 'txrp', networkType: 'ripple' },
    { path: "m/44'/145'/i'", coin: 'bch' },
    { path: "m/49'/156'/i'", coin: 'btg' },
    { path: "m/44'/156'/i'", coin: 'btg', type: 'legacy' },
    { path: "m/44'/5'/i'", coin: 'dash' },
    { path: "m/49'/20'/i'", coin: 'dgb' },
    { path: "m/44'/20'/i'", coin: 'dgb', type: 'legacy' },
    { path: "m/44'/3'/i'", coin: 'doge' },
    { path: "m/44'/7'/i'", coin: 'nmc' },
    { path: "m/49'/28'/i'", coin: 'vtc' },
    { path: "m/44'/28'/i'", coin: 'vtc', type: 'legacy' },
    { path: "m/44'/133'/i'", coin: 'zec' },
];

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
            total: LIMIT * accountTypes.length,
            loaded: 0,
            failed: [],
        }
    );
};

const getDiscoveryForDevice = () => (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device || !device.features) return;
    return dispatch(getDiscovery(device.features.device_id));
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
                    failed: discovery.failed.concat([
                        {
                            network: item.coin,
                            networkType: item.networkType,
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
            loaded: discovery.loaded + 1,
            total,
        }),
    );

    dispatch({
        type: ACCOUNT.CREATE,
        payload: {
            index: item.index,
            type: item.type,
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
    // find not empty accounts
    const { accounts } = getState().wallet;
    const usedAccounts = accounts.filter(a => a.index === discovery.index && !a.empty);
    const bundle: DiscoveryItem[] = [];
    accountTypes.forEach(item => {
        // check if previous account of this type exists
        const type = item.type || 'normal';
        const prevAccount = usedAccounts.find(a => a.type === type && a.network === item.coin);
        // check if this coin not failed before
        const failed = discovery.failed
            ? discovery.failed.find(
                  f => f.network === item.coin && f.networkType === item.networkType,
              )
            : null;
        const skip = failed || (discovery.index >= 0 && !prevAccount);
        for (let i = 1; i <= BUNDLE_SIZE; i++) {
            const accountIndex = discovery.index + 1;
            // check if this account wasn't created before
            const existedAccount = accounts.find(
                a => a.type === type && a.network === item.coin && a.index === accountIndex,
            );
            if (!skip && !existedAccount) {
                bundle.push({
                    path: item.path.replace('i', accountIndex.toString()),
                    coin: item.coin,
                    // details: 'txs',
                    index: accountIndex,
                    type,
                    networkType: item.networkType || 'bitcoin',
                });
            }
        }
    });

    // sort by index
    // bundle = bundle.sort((a, b) => a.index - b.index);

    return bundle;
};

export const start = () => async (dispatch: Dispatch, _getState: GetState): Promise<void> => {
    // TODO:
    // - catch interruption and TrezorConnect error
    // - check id discovery is completed
    // - check if there are enough empty accounts loaded
    // - add subscriptions
    // - add progress, estimate how many accounts will be loaded vs. how much i already have
    // - filter coin by firmware (ex: xrp on T1)
    // - if currently load account is selected perform full transaction discovery?

    const discovery = dispatch(getDiscoveryForDevice());
    if (!discovery) return; // TODO: throw error in notification?
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
        await TrezorConnect.getFeatures({ keepSession: false });
        dispatch(
            update({
                device,
                status: STATUS.COMPLETED,
            }),
        );
        return;
    }

    const onBundleProgress = (event: ProgressEvent) => {
        const { progress } = event;
        dispatch(handleProgress(event, device, bundle[progress]));
    };

    TrezorConnect.on(UI.BUNDLE_PROGRESS, onBundleProgress);
    const result = await TrezorConnect.getAccountInfo({
        // device: {
        //     path: 'a',
        // },
        bundle,
        keepSession: true,
    });
    TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

    // process response
    if (result.success) {
        dispatch(start()); // try next index
    } else {
        // this error will be thrown only at the beginning of discovery process
        // it will determine which coins are not supported because one of exceptions below
        // - UI.FIRMWARE_NOT_SUPPORTED
        // - UI.FIRMWARE_NOT_COMPATIBLE
        // - UI.FIRMWARE_OLD
        // those coins should be added to "failed" field
        if (result.payload.code === 'bundle_fw_exception') {
            const coins: { index: number; coin: string; exception: string }[] = JSON.parse(
                result.payload.error,
            );
            const failed: Discovery['failed'] = coins.map(c => ({
                network: c.coin,
                networkType: bundle[c.index].networkType,
                error: c.exception,
                fwException: c.exception,
            }));
            // add failed coins to discovery
            dispatch(update({ device, failed, total: discovery.total - LIMIT * failed.length }));

            dispatch(start()); // restart process without failed coins
        } else if (result.payload.error === 'discovery_interrupted') {
            console.warn('BY USER!');
            await TrezorConnect.getFeatures({ keepSession: false });
            dispatch(update({ device, status: STATUS.STOPPED }, DISCOVERY.STOP));
        } else {
            // call getFeatures to release device session
            // await TrezorConnect.getFeatures({ keepSession: false });
            // discovery failed
            // TODO: reduce index to "start"
            dispatch(update({ device, status: STATUS.STOPPED }, DISCOVERY.STOP));
        }
        console.warn(result);
    }
};

export const stop = () => async (dispatch: Dispatch): Promise<void> => {
    const discovery = dispatch(getDiscoveryForDevice());
    if (discovery) {
        dispatch(update({ device: discovery.device, status: STATUS.STOPPING }));
        TrezorConnect.cancel('discovery_interrupted');
    }
};
