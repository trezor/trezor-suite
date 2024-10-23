import { createThunk, ExtraDependencies } from '@suite-common/redux-utils';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect, { AccountInfo, BundleProgress, StaticSessionId, UI } from '@trezor/connect';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    tryGetAccountIdentity,
    getDerivationType,
    isTrezorConnectBackendType,
} from '@suite-common/wallet-utils';
import { Discovery, DiscoveryItem, PartialDiscovery } from '@suite-common/wallet-types';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    NetworkAccount,
    NetworkSymbol,
    Network,
    networksCollection,
    normalizeNetworkAccounts,
    NormalizedNetworkAccount,
    Bip43Path,
} from '@suite-common/wallet-config';
import { getFirmwareVersion } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import {
    DISCOVERY_MODULE_PREFIX,
    completeDiscovery,
    createDiscovery,
    interruptDiscovery,
    startDiscovery,
    stopDiscovery,
    updateDiscovery,
} from './discoveryActions';
import {
    selectDiscoveryByDeviceState,
    selectDiscovery,
    selectDeviceDiscovery,
} from './discoveryReducer';
import { selectAccounts } from '../accounts/accountsReducer';
import { accountsActions } from '../accounts/accountsActions';

type ProgressEvent = BundleProgress<AccountInfo | null>['payload'];

export const LIMIT = 10;

/**
 * Filter collection of activated networks to only include those supported by device & suite
 */
export const filterUnavailableNetworks = (
    enabledNetworks: NetworkSymbol[],
    device?: TrezorDevice,
): Network[] =>
    networksCollection.filter(n => {
        const firmwareVersion = getFirmwareVersion(device);
        const internalModel = device?.features?.internal_model;

        const isSupportedInSuite =
            !n.support || // support is not defined => is supported
            !internalModel || // typescript. device undefined. => supported
            (n.support[internalModel] && // support is defined for current device
                versionUtils.isNewerOrEqual(firmwareVersion, n.support[internalModel] as string)); // device version is newer or equal to support field in networks => supported

        return (
            enabledNetworks.includes(n.symbol) &&
            !n.isHidden &&
            !device?.unavailableCapabilities?.[n.symbol] && // exclude by network symbol (ex: xrp on T1B1)
            isSupportedInSuite
        );
    });

/**
 * For a given network, return a collection of normalized accounts (incl. 'normal'), excluding types unsupported by device or suite
 */
export const filterUnavailableAccountTypes = (
    network: Network,
    device?: TrezorDevice,
): NormalizedNetworkAccount[] =>
    normalizeNetworkAccounts(network).filter(
        networkAccount =>
            isTrezorConnectBackendType(networkAccount.backendType) && // exclude accounts with unsupported backend type, such as coinjoin
            !device?.unavailableCapabilities?.[networkAccount.accountType!], // exclude by account types (ex: taproot)
    );

const calculateProgress =
    (discovery: Discovery) =>
    (_dispatch: any, getState: any, extra: ExtraDependencies): PartialDiscovery => {
        const { selectDevice } = extra.selectors;
        const device = selectDevice(getState());
        // reconstruct networks from discovery symbols, because we need to iterate through accounts
        const networksToCount = filterUnavailableNetworks(discovery.networks, device);

        // number of Cardano type coins which are activated and able to be discovered
        const numberOfCardanoCoins = discovery.networks.filter(
            symbol => symbol === 'ada' || symbol === 'tada',
        ).length;

        const { numberOfNonCardano, numberOfCardano } = networksToCount.reduce(
            (acc, network) => {
                const { symbol } = network;

                // increment the appropriate counter as per symbol foreach normalized account (normal as well as all alternative accounts)
                filterUnavailableAccountTypes(network, device).forEach(() => {
                    if (symbol === 'ada' || symbol === 'tada') acc.numberOfCardano += 1;
                    else acc.numberOfNonCardano += 1;
                });

                return acc;
            },
            { numberOfNonCardano: 0, numberOfCardano: 0 },
        );

        // This approach handles both scenarios effectively:
        //
        // 1) Cardano added - When Cardano is included, discovery.availableCardanoDerivations may vary (2 to 3 based on device seed length).
        //    This object might be undefined if discovery hasn't been completed yet.
        //    To ensure the "activate coins" button appears, we set it to numberOfCardano.
        //    numberOfCardano is 1 or 2, depending on which Cardano networks are enabled (ada, tada).
        //
        // 2) Cardano removed - When Cardano is removed, discovery.availableCardanoDerivations might still hold a value.
        //    However, due to Math.min, it correctly resolves to 0 since numberOfCardano is 0.
        //

        const numberOfCardanoTotal = Math.min(
            discovery.availableCardanoDerivations?.length ?? numberOfCardano
                ? numberOfCardanoCoins
                : 0,
            numberOfCardano,
        );

        let total = LIMIT * (numberOfNonCardano + numberOfCardanoTotal);

        let loaded = 0;
        const accounts = selectAccounts(getState());
        const accountsByDeviceState = accounts.filter(a => a.deviceState === discovery.deviceState);

        accountsByDeviceState.forEach(a => {
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

const handleProgressThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/handleProgress`,
    (
        {
            event,
            deviceState,
            item,
            metadataEnabled,
        }: {
            event: ProgressEvent;
            deviceState: StaticSessionId;
            item: DiscoveryItem;
            metadataEnabled: boolean;
        },
        { dispatch, getState },
    ) => {
        // get fresh discovery data
        const discovery = selectDiscoveryByDeviceState(getState(), deviceState);
        // ignore progress event when:
        // 1. discovery is not running (interrupted/stopped/complete)
        if (!discovery || discovery.status >= DiscoveryStatus.STOPPING) return;
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
            dispatch(
                accountsActions.createAccount({
                    deviceState,
                    discoveryItem: item,
                    accountInfo: response,
                    // first normal account is always visible on web & desktop (but not in suite-native)
                    visible: (item.accountType === 'normal' && item.index === 0) || !response.empty,
                }),
            );
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
            updateDiscovery({
                ...progress,
                authConfirm,
                bundleSize: discovery.bundleSize - 1,
                failed,
            }),
        );
    },
);

export const stopDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/stop`,
    (_, { dispatch, getState }) => {
        const discovery = selectDeviceDiscovery(getState());
        if (discovery && discovery.running) {
            dispatch(
                interruptDiscovery({
                    deviceState: discovery.deviceState,
                    status: DiscoveryStatus.STOPPING,
                }),
            );
            TrezorConnect.cancel('discovery_interrupted');

            return discovery.running.promise;
        }
    },
);

export const getBundleThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/getBundle`,
    ({ discovery, device }: { discovery: Discovery; device: TrezorDevice }, { getState }) => {
        const bundle: DiscoveryItem[] = [];
        const accounts = selectAccounts(getState());
        // find all accounts
        const accountsByDeviceState = accounts.filter(a => a.deviceState === discovery.deviceState);

        // corner-case: discovery is running so it's at least second iteration
        // progress event wasn't emitted from '@trezor/connect' so there are no accounts, neither loaded or failed
        // return empty bundle to complete discovery
        if (
            discovery.status === DiscoveryStatus.RUNNING &&
            !accountsByDeviceState.length &&
            !discovery.failed.length
        ) {
            return bundle;
        }

        const addNetworkAccountToBundle = (
            configNetwork: Network,
            { bip43Path, accountType }: NetworkAccount,
        ) => {
            const { networkType, symbol: networkSymbol } = configNetwork;

            // find all existed accounts
            const prevAccounts = accountsByDeviceState
                .filter(
                    account =>
                        account.accountType === accountType && account.symbol === networkSymbol,
                )
                .sort((a, b) => b.index - a.index);

            // check if requested coin already have an empty account
            const hasEmptyAccount = prevAccounts.find(a => a.empty && !a.visible);
            // check if requested coin not failed before
            const failed = discovery.failed.find(
                account => account.symbol === networkSymbol && account.accountType === accountType,
            );

            // skip legacy/ledger accounts if availableCardanoDerivations doesn't include their respective derivation
            const skipCardanoDerivation =
                networkType === 'cardano' &&
                (accountType === 'ledger' || accountType === 'legacy') &&
                !discovery.availableCardanoDerivations?.includes(accountType);

            if (!hasEmptyAccount && !failed && !skipCardanoDerivation) {
                const index = prevAccounts[0] ? prevAccounts[0].index + 1 : 0;
                const isEvmLedgerDerivationPath =
                    networkType === 'ethereum' && accountType === 'ledger';

                const pathIndex = (index + (isEvmLedgerDerivationPath ? 1 : 0)).toString();

                bundle.push({
                    path: bip43Path.replace('i', pathIndex) as Bip43Path,
                    coin: networkSymbol,
                    identity: tryGetAccountIdentity({
                        networkType,
                        deviceState: discovery.deviceState,
                    }),
                    details: 'txs',
                    index,
                    pageSize: getTxsPerPage(networkType),
                    accountType,
                    networkType,
                    derivationType: getDerivationType(accountType),
                    suppressBackupWarning: true,
                });
            }
        };

        // foreach network, start discovery foreach normalized account (normal as well as all alternative accounts)
        filterUnavailableNetworks(discovery.networks, device).forEach(configNetwork =>
            filterUnavailableAccountTypes(configNetwork, device).forEach(configAccount =>
                addNetworkAccountToBundle(configNetwork, configAccount),
            ),
        );

        return bundle;
    },
);

export const getAvailableCardanoDerivationsThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/getAvailableCardanoDerivations`,
    async (
        { deviceState, device }: { deviceState: StaticSessionId; device: TrezorDevice },
        { dispatch },
    ): Promise<('normal' | 'legacy' | 'ledger')[] | undefined> => {
        // If icarus and icarus-trezor derivations return same pub key
        // we can skip derivation of the latter as it would discover same accounts.
        // Ledger derivation will always result in different pub key except in shamir where all derivations are the same
        const commonParams = {
            device,
            useEmptyPassphrase: device.useEmptyPassphrase,
            keepSession: true,
            skipFinalReload: true,
            path: "m/1852'/1815'/0'",
            useCardanoDerivation: true,
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
                stopDiscovery({
                    deviceState,
                    status: DiscoveryStatus.STOPPED,
                    error,
                    errorCode: code,
                }),
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
    },
);

export const startDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    async (_, { dispatch, getState, extra }): Promise<void> => {
        const {
            selectors: { selectMetadata, selectDevice },
            thunks: { initMetadata, fetchAndSaveMetadata },
            actions: { requestAuthConfirm },
        } = extra;
        const device = selectDevice(getState());
        const metadata = selectMetadata(getState());
        const discovery = selectDeviceDiscovery(getState());

        if (!device) {
            dispatch(
                notificationsActions.addToast({
                    type: 'discovery-error',
                    error: 'Device not found',
                }),
            );

            return;
        }

        if (device.authConfirm) {
            dispatch(
                notificationsActions.addToast({
                    type: 'discovery-error',
                    error: 'Device auth confirmation needed',
                }),
            );

            return;
        }

        if (!discovery) {
            dispatch(
                notificationsActions.addToast({
                    type: 'discovery-error',
                    error: 'Discovery not found',
                }),
            );

            return;
        }

        const { deviceState, authConfirm } = discovery;
        const metadataEnabled = metadata.enabled && !device.metadata[1]; // todo: can't import constant

        // start process
        if (
            discovery.status === DiscoveryStatus.IDLE ||
            discovery.status > DiscoveryStatus.STOPPING
        ) {
            // metadata are enabled in settings but metadata master key does not exist for this device
            // try to generate device metadata master key if passphrase is not used
            if (!authConfirm && metadataEnabled) {
                await dispatch(initMetadata(false));
            }

            dispatch(
                startDiscovery({
                    ...discovery,
                    status: DiscoveryStatus.RUNNING,
                }),
            );
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
                getAvailableCardanoDerivationsThunk({ deviceState, device }),
            ).unwrap();
            if (!availableCardanoDerivations) {
                // Edge case where getAvailableCardanoDerivations dispatches error, stops discovery and returns undefined.
                return;
            }
            dispatch({
                type: updateDiscovery.type,
                payload: {
                    ...discovery,
                    availableCardanoDerivations,
                },
            });
        }

        // prepare bundle of accounts to discover, exclude unsupported account types
        const bundle = await dispatch(
            getBundleThunk({
                discovery: { ...discovery, availableCardanoDerivations },
                device,
            }),
        ).unwrap();

        // discovery process complete
        if (bundle.length === 0) {
            if (discovery.status <= DiscoveryStatus.RUNNING && device.connected) {
                // call getFeatures to release device session
                await TrezorConnect.getFeatures({
                    device,
                    keepSession: false,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                });
                if (authConfirm) {
                    dispatch(requestAuthConfirm());
                }
            }

            // if previous discovery status was running (typically after application start or when user added a new account)
            // trigger fetch metadata; necessary to load account labels
            if (discovery.status === DiscoveryStatus.RUNNING) {
                dispatch(fetchAndSaveMetadata(deviceState));
            }

            dispatch(
                completeDiscovery({
                    deviceState,
                    status: DiscoveryStatus.COMPLETED,
                }),
            );

            return;
        }

        dispatch(
            updateDiscovery({
                deviceState,
                bundleSize: bundle.length,
                status: DiscoveryStatus.RUNNING,
            }),
        );

        // handle @trezor/connect event
        const onBundleProgress = (event: ProgressEvent) => {
            const { progress } = event;
            // pass more parameters to handler
            dispatch(
                handleProgressThunk({
                    event,
                    deviceState,
                    item: bundle[progress],
                    metadataEnabled,
                }),
            );
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
            const currentDiscovery = selectDiscoveryByDeviceState(getState(), deviceState);
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
                    updateDiscovery({
                        deviceState,
                        authConfirm: false,
                    }),
                );
                // try to generate device metadata master key
                await dispatch(initMetadata(false));
            }
            if (currentDiscovery.status === DiscoveryStatus.RUNNING) {
                await dispatch(startDiscoveryThunk()); // try next index
            } else if (currentDiscovery.status === DiscoveryStatus.STOPPING) {
                dispatch(stopDiscovery({ deviceState, status: DiscoveryStatus.STOPPED }));
            } else {
                dispatch(
                    notificationsActions.addToast({
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
                        updateDiscovery({
                            ...progress,
                            bundleSize: discovery.bundleSize - failed.length,
                            failed,
                        }),
                    );

                    await dispatch(startDiscoveryThunk()); // restart process, exclude failed coins

                    return;
                } catch {
                    // do nothing. error will be handled in lower block
                }
            }

            if (
                result.payload.error &&
                device.connected &&
                // but not when another application stole this device. no need to release session in this case
                result.payload.code !== 'Device_UsedElsewhere' &&
                // also not when user disconnected device during discovery
                result.payload.code !== 'Device_Disconnected'
            ) {
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
                stopDiscovery({
                    deviceState,
                    status: DiscoveryStatus.STOPPED,
                    error,
                    errorCode: result.payload.code,
                }),
            );

            if (error) {
                dispatch(notificationsActions.addToast({ type: 'discovery-error', error }));
            }
        }
    },
);

export const createDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/create`,
    (
        { deviceState, device }: { deviceState: StaticSessionId; device: TrezorDevice },
        { dispatch, getState, extra },
    ) => {
        const {
            selectors: { selectEnabledNetworks },
        } = extra;
        const enabledNetworks = selectEnabledNetworks(getState());
        const filteredNetworks = filterUnavailableNetworks(enabledNetworks, device);
        const networksSymbols = filteredNetworks.map(n => n.symbol);

        // calculate theoretical limit of accounts per enabled networks (then `calculateProgress` will gradually converge on the real number)
        const availableConfigAccounts = filteredNetworks.reduce(
            (count, network) => count + filterUnavailableAccountTypes(network).length,
            0,
        );
        const maxTotalAccounts = LIMIT * availableConfigAccounts;

        dispatch(
            createDiscovery({
                deviceState,
                authConfirm: !device.useEmptyPassphrase,
                index: 0,
                status: DiscoveryStatus.IDLE,
                total: maxTotalAccounts,
                bundleSize: 0,
                loaded: 0,
                failed: [],
                networks: networksSymbols,
            }),
        );
    },
);

export const updateNetworkSettingsThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/updateNetworkSettings`,
    (_, { dispatch, getState, extra }) => {
        const {
            selectors: { selectEnabledNetworks, selectDevices },
        } = extra;
        const enabledNetworks = selectEnabledNetworks(getState());
        const discovery = selectDiscovery(getState());
        discovery.forEach(d => {
            const devices = selectDevices(getState());
            const device = devices.find(dev => dev.state === d.deviceState);
            const networksSymbols = filterUnavailableNetworks(enabledNetworks, device).map(
                n => n.symbol,
            );

            const progress = dispatch(
                calculateProgress({
                    ...d,
                    networks: networksSymbols,
                    failed: [],
                }),
            );
            dispatch(
                updateDiscovery({
                    ...progress,
                    networks: networksSymbols,
                    failed: [],
                }),
            );
        });
    },
);

export const restartDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/restart`,
    async (_, { dispatch, getState }) => {
        const discovery = selectDeviceDiscovery(getState());
        if (!discovery) return;
        const progress = dispatch(
            calculateProgress({
                ...discovery,
                failed: [],
            }),
        );
        dispatch(
            updateDiscovery({
                ...progress,
                failed: [],
            }),
        );
        await dispatch(startDiscoveryThunk());
    },
);
