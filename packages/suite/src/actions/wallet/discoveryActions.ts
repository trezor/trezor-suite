import { versionUtils } from '@trezor/utils';
import { Discovery, PartialDiscovery } from '@wallet-reducers/discoveryReducer';
import TrezorConnect, { BundleProgress, AccountInfo, UI } from '@trezor/connect';
import { addToast } from '@suite-actions/notificationActions';
import { SUITE } from '@suite-actions/constants';
import { create as createAccount } from '@wallet-actions/accountActions';
import * as metadataActions from '@suite-actions/metadataActions';
import { DISCOVERY } from '@wallet-actions/constants';
import { SETTINGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import { Dispatch, GetState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { getDerivationType } from '@wallet-utils/../../../../../suite-common/wallet-utils/src/cardanoUtils';

export type DiscoveryAction =
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
    // @trezor/connect
    path: string;
    coin: Account['symbol'];
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
    pageSize?: number;
    // wallet
    index: number;
    accountType: Account['accountType'];
    networkType: Account['networkType'];
    derivationType?: 0 | 1 | 2;
}

type ProgressEvent = BundleProgress<AccountInfo | null>['payload'];

const LIMIT = 10;

// Get discovery process for deviceState.
export const getDiscovery =
    (deviceState: string) =>
    (_dispatch: Dispatch, getState: GetState): Discovery | undefined => {
        const { discovery } = getState().wallet;
        return discovery.find(d => d.deviceState === deviceState);
    };

export const getDiscoveryForDevice =
    () =>
    (dispatch: Dispatch, getState: GetState): Discovery | undefined => {
        const { device } = getState().suite;
        if (!device || !device.state) return;
        return dispatch(getDiscovery(device.state));
    };

/**
 * Helper action called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const getDiscoveryAuthConfirmationStatus =
    () =>
    (dispatch: Dispatch, getState: GetState): boolean | undefined => {
        const { device } = getState().suite;
        if (!device || !device.state) return;
        const discovery = dispatch(getDiscovery(device.state));
        if (!discovery) return;
        return (
            discovery.authConfirm &&
            (discovery.status < DISCOVERY.STATUS.STOPPING ||
                discovery.status === DISCOVERY.STATUS.COMPLETED)
        );
    };

export const update = (
    payload: PartialDiscovery,
    type: UpdateActionType = DISCOVERY.UPDATE,
): DiscoveryAction => ({
    type,
    payload,
});

const calculateProgress =
    (discovery: Discovery) =>
    (_dispatch: Dispatch, getState: GetState): PartialDiscovery => {
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

const handleProgress =
    (event: ProgressEvent, deviceState: string, item: DiscoveryItem, metadataEnabled: boolean) =>
    (dispatch: Dispatch) => {
        // get fresh discovery data
        const discovery = dispatch(getDiscovery(deviceState));
        // ignore progress event when:
        // 1. discovery is not running (interrupted/stopped/complete)
        if (!discovery || discovery.status >= DISCOVERY.STATUS.STOPPING) return;
        // 2. account network is no longer part of discovery (network disabled in wallet settings)
        if (!discovery.networks.includes(item.coin)) return;
        // process event
        const { response, error } = event;
        let { failed } = discovery;
        if (error || !response) {
            failed = failed.concat([
                {
                    index: item.index,
                    symbol: item.coin,
                    accountType: item.accountType,
                    error: error || 'discoveryActions: handle progress error', // unknown error, should not happen
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

        // change auth confirm field only if metadata are not enabled
        // otherwise authConfirm is processed in `start() > process response`
        let { authConfirm } = discovery;
        if (authConfirm && response && !metadataEnabled) {
            authConfirm = response.empty;
        }

        // update discovery
        dispatch(
            update({
                ...progress,
                authConfirm,
                bundleSize: discovery.bundleSize - 1,
                failed,
            }),
        );
    };

const filterUnavailableNetworks = (enabledNetworks: Account['symbol'][], device?: TrezorDevice) =>
    NETWORKS.filter(n => {
        const isSupportedInSuite =
            !n.support || // support is not defined => is supported
            !device?.features || // typescript. device undefined. => supported
            (n.support[device.features.major_version] && // support is defined for current device
                versionUtils.isNewerOrEqual(
                    [
                        device.features.major_version,
                        device.features.minor_version,
                        device.features.patch_version,
                    ],
                    n.support[device.features.major_version],
                )); // device version is newer or equal to support field in networks => supported

        return (
            enabledNetworks.includes(n.symbol) &&
            !n.isHidden &&
            !device?.unavailableCapabilities?.[n.accountType!] && // exclude by account types (ex: taproot)
            !device?.unavailableCapabilities?.[n.symbol] && // exclude by network symbol (ex: xrp on T1)
            isSupportedInSuite
        );
    });

const getBundle =
    (discovery: Discovery, device: TrezorDevice) =>
    (_d: Dispatch, getState: GetState): DiscoveryItem[] => {
        const bundle: DiscoveryItem[] = [];
        // find all accounts
        const accounts = getState().wallet.accounts.filter(
            a => a.deviceState === discovery.deviceState,
        );

        // corner-case: discovery is running so it's at least second iteration
        // progress event wasn't emitted from '@trezor/connect' so there are no accounts, neither loaded or failed
        // return empty bundle to complete discovery
        if (
            discovery.status === DISCOVERY.STATUS.RUNNING &&
            !accounts.length &&
            !discovery.failed.length
        ) {
            return bundle;
        }

        const networks = filterUnavailableNetworks(discovery.networks, device);
        networks.forEach(configNetwork => {
            // find all existed accounts
            const accountType = configNetwork.accountType || 'normal';
            const prevAccounts = accounts
                .filter(
                    account =>
                        account.accountType === accountType &&
                        account.symbol === configNetwork.symbol,
                )
                .sort((a, b) => b.index - a.index);

            // check if requested coin already have an empty account
            const hasEmptyAccount = prevAccounts.find(a => a.empty && !a.visible);
            // check if requested coin not failed before
            const failed = discovery.failed.find(
                account =>
                    account.symbol === configNetwork.symbol && account.accountType === accountType,
            );

            // skip legacy/ledger accounts if availableCardanoDerivations doesn't include their respective derivation
            const skipCardanoDerivation =
                configNetwork.networkType === 'cardano' &&
                (configNetwork.accountType === 'ledger' ||
                    configNetwork.accountType === 'legacy') &&
                !discovery.availableCardanoDerivations?.includes(configNetwork.accountType);

            if (!hasEmptyAccount && !failed && !skipCardanoDerivation) {
                const index = prevAccounts[0] ? prevAccounts[0].index + 1 : 0;
                bundle.push({
                    path: configNetwork.bip43Path.replace('i', index.toString()),
                    coin: configNetwork.symbol,
                    details: 'txs',
                    index,
                    pageSize: SETTINGS.TXS_PER_PAGE,
                    accountType,
                    networkType: configNetwork.networkType,
                    derivationType: getDerivationType(accountType),
                });
            }
        });
        return bundle;
    };

export const updateNetworkSettings = () => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    const { discovery } = getState().wallet;
    discovery.forEach(d => {
        const device = getState().devices.find(dev => dev.state === d.deviceState);
        const networks = filterUnavailableNetworks(enabledNetworks, device).map(n => n.symbol);

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

const getAvailableCardanoDerivations =
    (deviceState: string, device: TrezorDevice) =>
    async (dispatch: Dispatch): Promise<('normal' | 'legacy' | 'ledger')[] | undefined> => {
        // If icarus and icarus-trezor derivations return same pub key
        // we can skip derivation of the latter as it would discover same accounts.
        // Ledger derivation will always result in different pub key except in shamir where all derivations are the same
        const commonParams = {
            device,
            keepSession: true,
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: "m/1852'/1815'/0'",
        };
        const icarusPubKeyResult = await TrezorConnect.cardanoGetPublicKey({
            ...commonParams,
            derivationType: getDerivationType('normal'),
        });

        const icarusTrezorPubKeyResult = await TrezorConnect.cardanoGetPublicKey({
            ...commonParams,
            derivationType: getDerivationType('legacy'),
        });

        const ledgerPubKeyResult = await TrezorConnect.cardanoGetPublicKey({
            ...commonParams,
            derivationType: getDerivationType('ledger'),
        });

        if (
            !icarusPubKeyResult.success ||
            !icarusTrezorPubKeyResult.success ||
            !ledgerPubKeyResult.success
        ) {
            let error: string | undefined;
            let code: string | undefined;

            // extract error from first failed cardanoGetPublicKey request
            const derivationFail = [
                icarusPubKeyResult,
                icarusTrezorPubKeyResult,
                ledgerPubKeyResult,
            ].find(r => !r.success);
            if (derivationFail && !derivationFail.success) {
                error = derivationFail.payload.error;
                code = derivationFail.payload.code;
            }

            dispatch(
                update(
                    {
                        deviceState,
                        status: DISCOVERY.STATUS.STOPPED,
                        error,
                        errorCode: code,
                    },
                    DISCOVERY.STOP,
                ),
            );
            return;
        }

        const icarusPubKey = icarusPubKeyResult.payload.publicKey;
        const icarusTrezorPubKey = icarusTrezorPubKeyResult.payload.publicKey;
        const ledgerPubKey = ledgerPubKeyResult.payload.publicKey;

        if (icarusPubKey === icarusTrezorPubKey && icarusPubKey === ledgerPubKey) {
            // all pub keys are the same
            return ['normal'];
        }
        if (icarusPubKey === icarusTrezorPubKey) {
            // ledger pub key is different
            return ['normal', 'ledger'];
        }

        // each pub key is different
        return ['normal', 'legacy', 'ledger'];
    };

export const create =
    (deviceState: string, device: TrezorDevice) => (dispatch: Dispatch, getState: GetState) => {
        const { enabledNetworks } = getState().wallet.settings;
        const networks = filterUnavailableNetworks(enabledNetworks, device).map(n => n.symbol);

        dispatch({
            type: DISCOVERY.CREATE,
            payload: {
                deviceState,
                authConfirm: !device.useEmptyPassphrase,
                index: 0,
                status: DISCOVERY.STATUS.IDLE,
                total: LIMIT * networks.length,
                bundleSize: 0,
                loaded: 0,
                failed: [],
                networks,
            },
        });
    };

export const remove = (deviceState: string): DiscoveryAction => ({
    type: DISCOVERY.REMOVE,
    payload: {
        deviceState,
    },
});

export const start =
    () =>
    async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const { device } = getState().suite;
        const { metadata } = getState();

        const discovery = dispatch(getDiscoveryForDevice());
        if (!device) {
            dispatch(addToast({ type: 'discovery-error', error: 'Device not found' }));
            return;
        }
        if (device.authConfirm) {
            dispatch(
                addToast({ type: 'discovery-error', error: 'Device auth confirmation needed' }),
            );
            return;
        }
        if (!discovery) {
            dispatch(addToast({ type: 'discovery-error', error: 'Discovery not found' }));
            return;
        }

        const { deviceState, authConfirm } = discovery;
        const metadataEnabled = metadata.enabled && device.metadata.status === 'disabled';

        // start process
        if (
            discovery.status === DISCOVERY.STATUS.IDLE ||
            discovery.status > DISCOVERY.STATUS.STOPPING
        ) {
            // metadata are enabled in settings but metadata master key does not exist for this device
            // try to generate device metadata master key if passphrase is not used
            if (!authConfirm && metadataEnabled) {
                await dispatch(metadataActions.init());
            }

            // start discovery
            dispatch({
                type: DISCOVERY.START,
                payload: {
                    ...discovery,
                    status: DISCOVERY.STATUS.RUNNING,
                },
            });
        }

        let { availableCardanoDerivations } = discovery;
        // This will run only during first discovery (on per device basis).
        // List of available derivations will be
        // stored inside `availableCardanoDerivations` after first run
        if (
            discovery.networks.find(n => n === 'ada' || n === 'tada') &&
            availableCardanoDerivations === undefined
        ) {
            // check if discovery of legacy (icarus-trezor) or ledger accounts is needed and update discovery accordingly
            availableCardanoDerivations = await dispatch(
                getAvailableCardanoDerivations(deviceState, device),
            );
            if (!availableCardanoDerivations) {
                // Edge case where getAvailableCardanoDerivations dispatches error, stops discovery and returns undefined.
                return;
            }
            dispatch({
                type: DISCOVERY.UPDATE,
                payload: {
                    ...discovery,
                    availableCardanoDerivations,
                },
            });
        }

        // prepare bundle of accounts to discover, exclude unsupported account types
        const bundle = dispatch(getBundle({ ...discovery, availableCardanoDerivations }, device));

        // discovery process complete
        if (bundle.length === 0) {
            if (discovery.status <= DISCOVERY.STATUS.RUNNING && device.connected) {
                // call getFeatures to release device session
                await TrezorConnect.getFeatures({
                    device,
                    keepSession: false,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                });
                if (authConfirm) {
                    dispatch({ type: SUITE.REQUEST_AUTH_CONFIRM });
                }
            }

            // if previous discovery status was running (typically after application start or when user added a new account)
            // trigger fetch metadata; necessary to load account labels
            if (discovery.status === DISCOVERY.STATUS.RUNNING) {
                dispatch(metadataActions.fetchMetadata(deviceState));
            }

            dispatch(
                update(
                    {
                        deviceState,
                        status: DISCOVERY.STATUS.COMPLETED,
                    },
                    DISCOVERY.COMPLETE,
                ),
            );
            return;
        }

        dispatch(
            update({ deviceState, bundleSize: bundle.length, status: DISCOVERY.STATUS.RUNNING }),
        );

        // handle @trezor/connect event
        const onBundleProgress = (event: ProgressEvent) => {
            const { progress } = event;
            // pass more parameters to handler
            dispatch(handleProgress(event, deviceState, bundle[progress], metadataEnabled));
        };

        TrezorConnect.on<AccountInfo | null>(UI.BUNDLE_PROGRESS, onBundleProgress);
        const result = await TrezorConnect.getAccountInfo({
            device,
            bundle,
            keepSession: true,
            skipFinalReload: true,
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

        // process response
        if (result.success) {
            // fetch fresh data from reducer
            const currentDiscovery = dispatch(getDiscovery(deviceState));
            if (!currentDiscovery) return;
            // discovery process is still in authConfirm mode (not changed by handleProgress function)
            // and there is at least one used account in response
            // try generate metadata keys before next bundle request
            // otherwise metadata request will be processed in `metadataMiddleware` after auth confirmation
            if (
                metadataEnabled &&
                authConfirm &&
                currentDiscovery.authConfirm &&
                result.payload.find(a => a && !a.empty)
            ) {
                dispatch(
                    update({
                        deviceState,
                        authConfirm: false,
                    }),
                );
                // try to generate device metadata master key
                await dispatch(metadataActions.init());
            }
            if (currentDiscovery.status === DISCOVERY.STATUS.RUNNING) {
                await dispatch(start()); // try next index
            } else if (currentDiscovery.status === DISCOVERY.STATUS.STOPPING) {
                dispatch(update({ deviceState, status: DISCOVERY.STATUS.STOPPED }, DISCOVERY.STOP));
            } else {
                dispatch(
                    addToast({
                        type: 'discovery-error',
                        error: 'Reading accounts error: Discovery process is not running',
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
            if (result.payload.code === 'Method_Discovery_BundleException') {
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
                        symbol: bundle[c.index].coin,
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

            if (result.payload.error && device.connected) {
                // call getFeatures to release device session
                await TrezorConnect.getFeatures({
                    device,
                    keepSession: false,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                });
            }

            const error =
                result.payload.error !== 'discovery_interrupted' ? result.payload.error : undefined;
            dispatch(
                update(
                    {
                        deviceState,
                        status: DISCOVERY.STATUS.STOPPED,
                        error,
                        errorCode: result.payload.code,
                    },
                    DISCOVERY.STOP,
                ),
            );

            if (error) {
                dispatch(addToast({ type: 'discovery-error', error }));
            }
        }
    };

export const stop = () => (dispatch: Dispatch) => {
    const discovery = dispatch(getDiscoveryForDevice());
    if (discovery && discovery.running) {
        dispatch(
            update(
                { deviceState: discovery.deviceState, status: DISCOVERY.STATUS.STOPPING },
                DISCOVERY.INTERRUPT,
            ),
        );
        TrezorConnect.cancel('discovery_interrupted');

        return discovery.running.promise;
    }
};

export const restart = () => async (dispatch: Dispatch) => {
    const discovery = dispatch(getDiscoveryForDevice());
    if (!discovery) return;
    const progress = dispatch(
        calculateProgress({
            ...discovery,
            failed: [],
        }),
    );
    dispatch(
        update({
            ...progress,
            failed: [],
        }),
    );
    await dispatch(start());
};
