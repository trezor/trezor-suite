import { type AsyncThunkAction } from '@reduxjs/toolkit';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import {
    type DeviceRootState,
    type LockDeviceDep,
    deviceActions,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getAddressForNetworkType,
    getPublicKeyForNetworkType,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    prepareNewAccountPayload,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type CallMethodAnyResponse,
    type CallMethodKeys,
    type CallMethodParams,
    type CallMethodPayload,
    type MethodInfo,
} from '@trezor/connect';
import { connectCallableMethods } from '@trezor/connect-common';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { DEEPLINK_VERSION } from '@trezor/connect-common/src/data/version';
import type { Bip43PathTemplate } from '@trezor/crypto-utils';
import { resolveAfter } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import { getPermissionDeferred, getPopupCallDeferred } from './connectPopupPromiseManager';
import {
    type ConnectPopupStateRootState,
    selectConnectAppPermissions,
    selectConnectPopupCall,
} from './connectPopupReducer';
import {
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectCallSource,
    SELECT_ACCOUNT_PAGE_SIZE,
    type SelectAccountCandidate,
    isUtxoNetwork,
} from './connectPopupTypes';
import { compatibilityHooks, postCallHooks, preCallHooks, validateCallHooks } from './methodHooks';
import type { DistributiveOmit } from './methodHooks/types';
import {
    deriveCardanoEnabledNetworks,
    mergePermissions,
    permissionsAreCovered,
    sanitizeRequestedPermissions,
} from './permissions';

const CONNECT_POPUP_MODULE = '@common/connect-popup';

type ConnectPopupCallThunkParams<M extends CallMethodKeys> = {
    method: M;
    payload: DistributiveOmit<CallMethodParams<M>, 'method'>;
    source: ConnectCallSource;
};

export type ConnectPopupCallThunkState = DeviceRootState &
    ConnectPopupStateRootState &
    AccountsRootState;
export type ConnectPopupCallThunkDeps = {
    actions: LockDeviceDep;
    services: AnalyticsDep;
};

export const connectPopupCallThunkInner = createThunk<
    void,
    ConnectPopupCallThunkParams<CallMethodKeys>,
    { state: ConnectPopupCallThunkState; extra: ConnectPopupCallThunkDeps }
>(
    `${CONNECT_POPUP_MODULE}/callThunk`,
    async ({ source, ...params }, { dispatch, getState, extra }) => {
        try {
            const { method, payload } = compatibilityHooks({ ...params, source });

            if (!connectCallableMethods.includes(method)) throw TypedError('Method_Unsupported');

            const methodInfo = await TrezorConnect.call({
                ...payload,
                method,
                __info: true,
                __precomposed: true,
            } as CallMethodPayload);
            if (!methodInfo.success) {
                throw methodInfo.error;
            }
            const methodInfoPayload = methodInfo.payload as MethodInfo;
            const callPermissions = methodInfoPayload.requiredPermissions;
            const hasPermission = (name: string) =>
                callPermissions.some(p => p.permission === name);
            if (
                hasPermission('management') ||
                hasPermission('internal') ||
                (hasPermission('push_tx') && source.type === CALL_SOURCE_DEEPLINK)
            ) {
                throw TypedError('Method_NotAllowed');
            }

            // Permissions the host/dapp declared up front (ConnectSettings.requestedPermissions),
            // sanitized against the same rules as the hard block above. Merged with this call's own
            // required permissions so the first consent covers the whole declared set at once — a
            // single "Remember" then silences every later in-scope call.
            const declaredPermissions = sanitizeRequestedPermissions(
                source.requestedPermissions,
                source.type === CALL_SOURCE_DEEPLINK,
            );
            const consentPermissions = mergePermissions(callPermissions, declaredPermissions);

            dispatch(
                connectPopupActions.initiateCall({
                    method,
                    methodInfo: {
                        methodTitle:
                            methodInfoPayload.confirmation?.label ?? methodInfoPayload.info,
                        confirmLabel: methodInfoPayload.confirmation?.customConfirmButton?.label,
                        permissionTypes: consentPermissions,
                        useUi: methodInfoPayload.useUi,
                    },
                    payload,
                    source,
                }),
            );

            // Reject a call this host cannot fulfil (e.g. selectAccount for a coin Suite can't render)
            // before asking for permissions, so the user doesn't approve access only to hit an error.
            validateCallHooks({ method, payload });

            // Check if permission remembered (permission, coin). Keyed on THIS call's required
            // permissions (not the declared superset) so a call is silent whenever its own needs are
            // already covered, even if the app declared more than it has been granted so far.
            const rememberedApps = selectConnectAppPermissions(getState());

            const isRemembered = rememberedApps.some(
                app =>
                    app.origin === source.origin &&
                    app.process?.fullPath === source.process?.fullPath &&
                    permissionsAreCovered(callPermissions, app.allowedPermissions),
            );

            if (!isRemembered && source.type !== CALL_SOURCE_WALLETCONNECT) {
                // Create the deferred BEFORE dispatching requestPermissions.
                // Otherwise the modal can render and the user can click "confirm"
                // (dispatching approvePermissions) before the deferred exists,
                // causing the thunk to hang forever on a second, unresolved deferred.
                const permissionDeferred = getPermissionDeferred(true);
                dispatch(connectPopupActions.requestPermissions());
                await permissionDeferred.promise;
            }

            // Project the granted per-coin permissions into @trezor/connect's enabledNetworks
            // capability (today: Cardano `derive_cardano`) before any device session is created.
            // Lives in the shared call thunk — not a host-side middleware — so it runs on every
            // platform (desktop/web popup AND native deeplink) and for remembered apps too (which
            // skip the approve action a middleware would key off). updateConnectSettings returns
            // { success: false } rather than throwing on the thin transports; the result is ignored.
            const enabledNetworks = deriveCardanoEnabledNetworks(consentPermissions);
            if (enabledNetworks.length) {
                await TrezorConnect.updateConnectSettings({ enabledNetworks });
            }

            let device = selectSelectedDevice(getState());
            let attempt = 0;
            // more time needed on mobile deeplink, less on desktop
            // todo: be smarter about the timeout based on actual connection events
            const maxAttempts = source.type === CALL_SOURCE_DEEPLINK ? 10 : 5;
            // retry loop to wait for device to reconnect
            while (!device?.connected) {
                await resolveAfter(1000);
                device = selectSelectedDevice(getState());
                attempt++;
                if (attempt > maxAttempts) {
                    throw TypedError('Device_Disconnected');
                }
            }

            const txSigningPrecomposed: PrecomposedTransactionFinal | undefined =
                methodInfoPayload.precomposed;
            const modifiedPayload = await preCallHooks({
                method,
                payload,
                dispatch,
                getState,
                txSigningPrecomposed,
                source,
            });

            // refresh device state before call (could have changed during preCallHooks)
            device = selectSelectedDevice(getState());
            if (!device) throw TypedError('Device_Disconnected');

            const response = await TrezorConnect.call({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                ...modifiedPayload,
                method,
            } as CallMethodPayload);
            response.id = undefined;

            const postCallOngoing = await postCallHooks({
                method,
                payload: modifiedPayload,
                originalPayload: payload,
                response,
                dispatch,
                getState,
                source,
            });
            if (!response.success) {
                throw response.error;
            }
            if (!postCallOngoing) {
                dispatch(connectPopupActions.finishCall());
                dispatch(
                    notificationsActions.addToast({
                        type: 'connect-popup-success',
                        appName: source.manifest.appName,
                    }),
                );
            }

            extra.services.analytics.report({
                type: events.connectPopupCallEvent.name,
                payload: {
                    method,
                    appName: source.manifest.appName,
                    appUrl: source.manifest.appUrl,
                    appEmail: source.manifest.email,
                    npmVersion: source.manifest.npmVersion,
                    connectionType: source.type,
                    origin: source.origin,
                },
            });

            getPopupCallDeferred().resolve(response);
        } catch (error) {
            console.error('connectPopupCallThunk', error);
            if (error?.error === 'switching-device') {
                // Do nothing, call will be restarted after device switch
                return;
            } else if (
                error?.code === 'Method_Cancel' ||
                error?.code === 'Method_Unsupported' // handled by fallback mechanism in connect-web
            ) {
                dispatch(connectPopupActions.finishCall());
            } else {
                dispatch(connectPopupActions.setError(serializeError(error)));

                // don't return error, allow user to reconnect device
                if (
                    error?.code === 'Device_NotFound' ||
                    error?.code === 'Device_Disconnected' ||
                    error?.code === 'Device_UsedElsewhere' ||
                    error?.code === 'Device_InvalidState'
                )
                    return;
            }

            extra.services.analytics.report({
                type: events.connectPopupErrorEvent.name,
                payload: {
                    method: params.method,
                    origin: source.origin,
                    error: error?.code,
                    appName: source.manifest.appName,
                    appUrl: source.manifest.appUrl,
                    appEmail: source.manifest.email,
                    npmVersion: source.manifest.npmVersion,
                    connectionType: source.type,
                },
            });

            getPopupCallDeferred().resolve({
                success: false,
                error: serializeError(error),
            });
        } finally {
            dispatch(extra.actions.lockDevice(false));
        }
    },
);

// Typed thunk that takes the method as a generic parameter
// Original thunk is exposed as well for using .fulfilled, .rejected, etc.
export const connectPopupCallThunk = <M extends CallMethodKeys>(
    params: ConnectPopupCallThunkParams<M>,
): AsyncThunkAction<
    void,
    ConnectPopupCallThunkParams<M>,
    { state: ConnectPopupCallThunkState; extra: ConnectPopupCallThunkDeps }
> => connectPopupCallThunkInner(params) as any;

type ConnectPopupDeeplinkThunkState = DeviceRootState &
    ConnectPopupStateRootState &
    AccountsRootState;
type ConnectPopupDeeplinkThunkDeps = {
    actions: LockDeviceDep;
    services: AnalyticsDep;
};

export const connectPopupDeeplinkThunk = createThunk<
    void,
    { url: string },
    { state: ConnectPopupDeeplinkThunkState; extra: ConnectPopupDeeplinkThunkDeps }
>(`${CONNECT_POPUP_MODULE}/deeplinkThunk`, async ({ url }, { dispatch }) => {
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (error) {
        console.warn('Invalid deeplink URL', { error, url });

        return;
    }

    const path = parsedUrl.pathname;
    const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());

    // Validate params
    const version = path?.split('/').slice(-2, -1)[0];
    if (
        !queryParams?.method ||
        !queryParams?.params ||
        !queryParams?.callback ||
        typeof queryParams?.params !== 'string' ||
        typeof queryParams?.method !== 'string' ||
        typeof queryParams?.callback !== 'string' ||
        !Object.prototype.hasOwnProperty.call(TrezorConnect, queryParams?.method)
    ) {
        dispatch(
            connectPopupActions.setError(serializeError(TypedError('Method_InvalidParameter'))),
        );

        return;
    }

    if (!version || parseInt(version) > DEEPLINK_VERSION) {
        dispatch(
            connectPopupActions.setError(serializeError(TypedError('Deeplink_VersionMismatch'))),
        );

        return;
    }

    const { method, callback } = queryParams;
    let payload, callbackUrl;
    try {
        payload = JSON.parse(queryParams.params);
        callbackUrl = new URL(callback);
    } catch {
        dispatch(
            connectPopupActions.setError(serializeError(TypedError('Method_InvalidParameter'))),
        );

        return;
    }

    dispatch(
        connectPopupCallThunk({
            source: {
                type: CALL_SOURCE_DEEPLINK,
                origin: `${callbackUrl.protocol}//${callbackUrl.host}`,
                manifest: {
                    appName: queryParams.appName ?? '',
                    appIcon: queryParams.appIcon ?? '',
                },
            },
            method: method as CallMethodKeys,
            payload,
        }),
    );
    const response = await getPopupCallDeferred(true).promise;
    callbackUrl.searchParams.set('response', JSON.stringify(response));
    dispatch(
        connectPopupActions.deeplinkCallback({
            callbackUrl: callbackUrl.toString(),
        }),
    );
});

type ConnectPopupVerifyAddressThunkState = DeviceRootState & ConnectPopupStateRootState;
type ConnectPopupVerifyAddressThunkDeps = {
    actions: LockDeviceDep;
};

export const connectPopupVerifyAddressThunk = createThunk<
    void,
    { index: number },
    {
        state: ConnectPopupVerifyAddressThunkState;
        extra: ConnectPopupVerifyAddressThunkDeps;
    }
>(
    `${CONNECT_POPUP_MODULE}/verifyAddressThunk`,
    async ({ index }, { dispatch, getState, extra }) => {
        // Unlock device access from previous call
        dispatch(extra.actions.lockDevice(false));

        const device = selectSelectedDevice(getState());
        const call = selectConnectPopupCall(getState());
        if (!device || call?.state !== 'address-confirmation') return;

        // Update loading state of addresses
        dispatch(
            connectPopupActions.confirmAddresses({
                exported: call.exported,
                addresses: call.addresses?.map((address, i) => ({
                    ...address,
                    loading: i === index,
                })),
            }),
        );

        try {
            // @ts-expect-error: method is dynamic
            const res = await TrezorConnect[call.method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                ...call.addresses?.[index]?.validatePayload,
                showOnTrezor: true,
                chunked: false,
            });
            const validatedStatus = res.success ? 'valid' : 'failed';
            dispatch(
                connectPopupActions.confirmAddresses({
                    exported: call.exported,
                    addresses: call.addresses.map((address, i) => ({
                        ...address,
                        loading: false,
                        validated: i === index ? validatedStatus : address.validated,
                    })),
                }),
            );
        } catch (error) {
            console.error('connectPopupVerifyAddressThunk', error);
            dispatch(
                connectPopupActions.confirmAddresses({
                    exported: call.exported,
                    addresses: call.addresses.map((address, i) => ({
                        ...address,
                        loading: false,
                        validated: i === index ? 'failed' : address.validated,
                    })),
                }),
            );
        }
    },
);

// Resolves what a picker row actually exports, given the picker's mode:
// - 'xpub' (UTXO, addressSelection 'fullAccount'): the whole account, via its extended public key.
// - 'address' + UTXO ('firstFresh'): the account's next unused receive address, not the account
//   itself.
// - 'address' + non-UTXO (account-based networks): the account descriptor IS the address.
const resolveCandidateValue = (
    mode: 'xpub' | 'address',
    isUtxo: boolean,
    account: {
        path: string;
        descriptor: string;
        addresses?: { unused: { path: string; address: string }[] };
    },
): Pick<SelectAccountCandidate, 'path' | 'address' | 'xpub'> => {
    if (mode === 'xpub') return { path: account.path, xpub: account.descriptor };
    if (isUtxo) {
        // NOTE: can be undefined if the account has exhausted its unused-address gap limit.
        const fresh = account.addresses?.unused[0];

        return { path: fresh?.path ?? account.path, address: fresh?.address };
    }

    return { path: account.path, address: account.descriptor };
};

type ConnectPopupLoadSelectAccountPageThunkState = DeviceRootState &
    ConnectPopupStateRootState &
    AccountsRootState;
type ConnectPopupLoadSelectAccountPageThunkDeps = {
    actions: LockDeviceDep;
};

export const connectPopupLoadSelectAccountPageThunk = createThunk<
    void,
    { page: number },
    {
        state: ConnectPopupLoadSelectAccountPageThunkState;
        extra: ConnectPopupLoadSelectAccountPageThunkDeps;
    }
>(
    `${CONNECT_POPUP_MODULE}/loadSelectAccountPageThunk`,
    async ({ page }, { dispatch, getState, extra }) => {
        // release any device lock held by the (still pending) selectAccount call
        dispatch(extra.actions.lockDevice(false));

        const device = selectSelectedDevice(getState());
        const call = selectConnectPopupCall(getState());
        if (!device || call?.state !== 'select-account') return;

        // Keep the picker's two load layers from stepping on each other (see #29662):
        //  - loadingKey dedups an *identical* load. The concrete double-dispatch is the cold-cache
        //    manual drill-in: a nav thunk resets `candidates` to [] AND dispatches a load, while the
        //    auto-load effect ALSO fires one because `candidates === []`. Both target the same view,
        //    so the second is a no-op here — the expensive device round-trip runs only once.
        //  - loadEpoch resolves the write race for loads of *different* views that legitimately
        //    overlap (page/tab/phase/account changed mid-load): each stamps a fresh epoch and, after
        //    every await below, bails once a newer load supersedes it, so a stale load can never
        //    paint over the current view.
        // Both are stamped synchronously (before any await) so a same-tick re-dispatch sees them.
        const loadingKey = `${call.manualPhase ?? ''}:${call.selectedAccountTypeKey}:${call.manualAccountIndex ?? ''}:${page}`;
        if (call.loadingKey === loadingKey) return;

        const startedEpoch = (call.loadEpoch ?? 0) + 1;
        dispatch(connectPopupActions.updateSelectAccount({ loadingKey, loadEpoch: startedEpoch }));

        // Populates one page of the picker's account-index list. Used for every mode except UTXO
        // `addressSelection: 'manual'`'s address phase (see loadManualAddressPage below), which
        // browses one chosen account's existing addresses instead of paging through BIP44 account
        // indices. `manual`'s own account phase reuses this same list to let the user pick which
        // account to drill into — `includeValue: false` skips deriving address/xpub for those rows,
        // since picking one just navigates onward rather than exporting it.
        // Existing accounts are read from Redux discovery; indices without a discovered account
        // are derived on demand (sequentially — concurrent getAccountInfo calls would contend for
        // the same device).
        async function loadAccountIndexPage(
            activeDevice: NonNullable<ReturnType<typeof selectSelectedDevice>>,
            includeValue: boolean,
        ) {
            const initialCall = selectConnectPopupCall(getState());
            if (initialCall?.state !== 'select-account') return;

            const { options, candidates: prevCandidates, selectedAccountTypeKey } = initialCall;
            const { symbol, accountTypeTabs, mode } = options;
            const isUtxo = isUtxoNetwork(symbol);
            // accountTypeTabs is guaranteed non-empty by the methodHook that builds it
            const activeTab =
                accountTypeTabs.find(tab => tab.key === selectedAccountTypeKey) ??
                accountTypeTabs[0]!;

            // Redux discovery only knows about the network's built-in types — a custom bip43Path
            // tab has no existing accounts to reuse, everything is derived fresh.
            const existingAccounts = activeTab.accountType
                ? selectDeviceAccountsByNetworkSymbol(getState(), symbol).filter(
                      a => a.backendType !== 'coinjoin' && a.accountType === activeTab.accountType,
                  )
                : [];

            const startIndex = page * SELECT_ACCOUNT_PAGE_SIZE;
            const accountIndices = Array.from(
                { length: SELECT_ACCOUNT_PAGE_SIZE },
                (_, i) => startIndex + i,
            );

            // Build the page rows: reuse already-loaded candidates and Redux accounts; show a
            // skeleton (loading) for indices that still need on-device derivation.
            const rows: SelectAccountCandidate[] = accountIndices.map(accountIndex => {
                const cached = prevCandidates.find(
                    c => c.accountIndex === accountIndex && c.accountTypeKey === activeTab.key,
                );
                if (cached && !cached.loading) return cached;

                const existing = existingAccounts.find(a => a.index === accountIndex);
                if (existing) {
                    return {
                        symbol,
                        accountIndex,
                        accountTypeKey: activeTab.key,
                        ...(includeValue
                            ? resolveCandidateValue(mode, isUtxo, existing)
                            : { path: existing.path }),
                        balance: existing.formattedBalance,
                        used: !existing.empty,
                        selected: cached?.selected ?? false,
                        loading: false,
                        loadFailed: false,
                        verifying: false,
                        validated: cached?.validated ?? 'not-started',
                        mac: cached?.mac,
                    };
                }

                return {
                    symbol,
                    accountIndex,
                    accountTypeKey: activeTab.key,
                    path: '',
                    used: false,
                    selected: cached?.selected ?? false,
                    loading: true,
                    loadFailed: false,
                    verifying: false,
                    validated: 'not-started',
                };
            });

            // Merge the page rows into the full candidate list (keeping selections made on other
            // pages and other tabs) so multi-selection survives pagination and tab switches.
            const otherCandidates = prevCandidates.filter(
                c =>
                    !(
                        c.accountTypeKey === activeTab.key &&
                        accountIndices.includes(c.accountIndex)
                    ),
            );
            const merged = [...otherCandidates, ...rows].sort(
                (a, b) => a.accountIndex - b.accountIndex,
            );
            dispatch(
                connectPopupActions.updateSelectAccount({
                    candidates: merged,
                    page,
                    totalCandidates: undefined,
                }),
            );

            for (const row of rows) {
                if (!row.loading) continue;

                const result = await prepareNewAccountPayload({
                    accountType: activeTab.accountType ?? 'normal',
                    networkSymbol: symbol,
                    index: row.accountIndex,
                    selectedAccount: {
                        accountType: activeTab.accountType ?? 'normal',
                        bip43Path: activeTab.bip43Path as Bip43PathTemplate,
                    },
                    device: activeDevice,
                });

                // bail if the user navigated to another page/tab, this load was superseded by a
                // newer one of the same page, or the picker closed meanwhile
                const current = selectConnectPopupCall(getState());
                if (
                    current?.state !== 'select-account' ||
                    current.page !== page ||
                    current.selectedAccountTypeKey !== selectedAccountTypeKey ||
                    current.loadEpoch !== startedEpoch
                )
                    return;

                const resolved: SelectAccountCandidate =
                    result instanceof Error
                        ? { ...row, loading: false, loadFailed: true }
                        : {
                              ...row,
                              ...(includeValue
                                  ? resolveCandidateValue(mode, isUtxo, {
                                        path: result.path,
                                        descriptor: result.accountInfo.descriptor,
                                        addresses: result.accountInfo.addresses,
                                    })
                                  : { path: result.path }),
                              balance: formatNetworkAmount(result.accountInfo.balance, symbol),
                              used: !result.accountInfo.empty,
                              loading: false,
                              loadFailed: false,
                          };

                dispatch(
                    connectPopupActions.updateSelectAccount({
                        candidates: current.candidates.map(c =>
                            c.accountIndex === resolved.accountIndex &&
                            c.accountTypeKey === resolved.accountTypeKey
                                ? resolved
                                : c,
                        ),
                    }),
                );
            }
        }

        // Populates one page of the UTXO `addressSelection: 'manual'` picker's address phase: it
        // browses the previously-used addresses of the account chosen in the account phase (see
        // connectPopupSelectManualAccountThunk), instead of paging through BIP44 account indices.
        async function loadManualAddressPage(
            activeDevice: NonNullable<ReturnType<typeof selectSelectedDevice>>,
            manualAccountIndex: number,
        ) {
            const initialCall = selectConnectPopupCall(getState());
            if (initialCall?.state !== 'select-account') return;

            const { options, selectedAccountTypeKey } = initialCall;
            const { symbol, accountTypeTabs } = options;
            const activeTab =
                accountTypeTabs.find(tab => tab.key === selectedAccountTypeKey) ??
                accountTypeTabs[0]!;

            const isStillOnThisAccount = () => {
                const current = selectConnectPopupCall(getState());

                return (
                    current?.state === 'select-account' &&
                    current.selectedAccountTypeKey === selectedAccountTypeKey &&
                    current.manualAccountIndex === manualAccountIndex &&
                    // superseded by a newer load of the same page — its candidates must not land
                    current.loadEpoch === startedEpoch
                );
            };

            const paintPage = (
                usedAddresses: { path: string; address: string; balance: string }[],
            ) => {
                const current = selectConnectPopupCall(getState());
                if (current?.state !== 'select-account') return;

                const startIndex = page * SELECT_ACCOUNT_PAGE_SIZE;
                const pageAddresses = usedAddresses.slice(
                    startIndex,
                    startIndex + SELECT_ACCOUNT_PAGE_SIZE,
                );

                const rows: SelectAccountCandidate[] = pageAddresses.map((addr, i) => {
                    const accountIndex = startIndex + i;
                    const cached = current.candidates.find(
                        c => c.accountIndex === accountIndex && c.accountTypeKey === activeTab.key,
                    );

                    return {
                        symbol,
                        accountIndex,
                        accountTypeKey: activeTab.key,
                        path: addr.path,
                        address: addr.address,
                        balance: formatNetworkAmount(addr.balance, symbol),
                        used: true,
                        selected: cached?.selected ?? false,
                        loading: false,
                        loadFailed: false,
                        verifying: false,
                        validated: cached?.validated ?? 'not-started',
                        mac: cached?.mac,
                    };
                });

                // Keep candidates from other tabs AND from other pages of this tab, so selections
                // made on previously-loaded pages survive pagination (mirrors loadAccountIndexPage).
                // Filtering by tab alone would drop every prior page, since in the manual address
                // phase all rows share the single active tab.
                const otherCandidates = current.candidates.filter(
                    c =>
                        !(
                            c.accountTypeKey === activeTab.key &&
                            c.accountIndex >= startIndex &&
                            c.accountIndex < startIndex + SELECT_ACCOUNT_PAGE_SIZE
                        ),
                );
                dispatch(
                    connectPopupActions.updateSelectAccount({
                        candidates: [...otherCandidates, ...rows],
                        page,
                        totalCandidates: usedAddresses.length,
                    }),
                );
            };

            // Redux is an optimistic cache, not a source of truth: an account discovered earlier
            // (or with a coarser detail level) can have a stale or plain incomplete `addresses`
            // list — including a wrongly-empty `used` array for an account that does have history.
            // Paint it immediately (avoids a blank page while the device round-trip below is in
            // flight) but always reconcile with a fresh, authoritative getAccountInfo call.
            const existingAccount = activeTab.accountType
                ? selectDeviceAccountsByNetworkSymbol(getState(), symbol).find(
                      a =>
                          a.backendType !== 'coinjoin' &&
                          a.accountType === activeTab.accountType &&
                          a.index === manualAccountIndex,
                  )
                : undefined;
            if (existingAccount?.addresses?.used) {
                paintPage(existingAccount.addresses.used);
            }

            const result = await prepareNewAccountPayload({
                accountType: activeTab.accountType ?? 'normal',
                networkSymbol: symbol,
                index: manualAccountIndex,
                selectedAccount: {
                    accountType: activeTab.accountType ?? 'normal',
                    bip43Path: activeTab.bip43Path as Bip43PathTemplate,
                },
                device: activeDevice,
            });

            // bail if the user navigated to another tab/account or closed the picker meanwhile
            if (!isStillOnThisAccount()) return;

            if (result instanceof Error) {
                // Only clobber an optimistic paint with an empty state if we never had one.
                if (!existingAccount?.addresses?.used) {
                    dispatch(
                        connectPopupActions.updateSelectAccount({
                            candidates: [],
                            page,
                            totalCandidates: 0,
                        }),
                    );
                }

                return;
            }

            paintPage(result.accountInfo.addresses?.used ?? []);
        }

        try {
            if (call.options.addressSelection === 'manual' && call.manualPhase === 'address') {
                await loadManualAddressPage(device, call.manualAccountIndex ?? 0);
            } else if (call.options.addressSelection === 'manual') {
                await loadAccountIndexPage(device, false);
            } else {
                await loadAccountIndexPage(device, true);
            }
        } finally {
            // Release the dedup slot once this load settles — but only if this load still owns it.
            // Matching loadingKey alone is not enough: rapid re-navigation can re-enter the *same*
            // view (hence the same key) with a newer load still in flight (drill X → Y → X, or
            // drill → back → drill the same account), and this older load must not clear that newer
            // load's slot — that would re-open the dedup window and let the redundant device call
            // slip back in. loadEpoch is monotonic and unique per load, so it pins the clear to the
            // load that most recently stamped the key.
            const current = selectConnectPopupCall(getState());
            if (
                current?.state === 'select-account' &&
                current.loadingKey === loadingKey &&
                current.loadEpoch === startedEpoch
            ) {
                dispatch(connectPopupActions.updateSelectAccount({ loadingKey: undefined }));
            }
        }
    },
);

// UTXO `addressSelection: 'manual'` only: the user picked an account in the account phase — drill
// into it by switching to the address phase and loading its used addresses from page 0.
type ConnectPopupSelectManualAccountThunkState = DeviceRootState &
    ConnectPopupStateRootState &
    AccountsRootState;
type ConnectPopupSelectManualAccountThunkDeps = {
    actions: LockDeviceDep;
};

export const connectPopupSelectManualAccountThunk = createThunk<
    void,
    { accountIndex: number },
    {
        state: ConnectPopupSelectManualAccountThunkState;
        extra: ConnectPopupSelectManualAccountThunkDeps;
    }
>(
    `${CONNECT_POPUP_MODULE}/selectManualAccountThunk`,
    ({ accountIndex }, { dispatch, getState }) => {
        const call = selectConnectPopupCall(getState());
        if (call?.state !== 'select-account' || call.options.addressSelection !== 'manual') return;

        dispatch(
            connectPopupActions.updateSelectAccount({
                manualPhase: 'address',
                manualAccountIndex: accountIndex,
                candidates: [],
                page: 0,
            }),
        );
        dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
    },
);

// UTXO `addressSelection: 'manual'` only: back out of the address phase to the account list.
type ConnectPopupBackToManualAccountsThunkState = DeviceRootState &
    ConnectPopupStateRootState &
    AccountsRootState;
type ConnectPopupBackToManualAccountsThunkDeps = {
    actions: LockDeviceDep;
};

export const connectPopupBackToManualAccountsThunk = createThunk<
    void,
    void,
    {
        state: ConnectPopupBackToManualAccountsThunkState;
        extra: ConnectPopupBackToManualAccountsThunkDeps;
    }
>(`${CONNECT_POPUP_MODULE}/backToManualAccountsThunk`, (_, { dispatch, getState }) => {
    const call = selectConnectPopupCall(getState());
    if (call?.state !== 'select-account' || call.options.addressSelection !== 'manual') return;

    dispatch(
        connectPopupActions.updateSelectAccount({
            manualPhase: 'account',
            manualAccountIndex: undefined,
            candidates: [],
            page: 0,
            totalCandidates: undefined,
        }),
    );
    dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
});

// Verifies a single candidate address on the device. Safe to run while the selectAccount call is
// pending because that method holds no device session (useDevice = false).
type ConnectPopupVerifySelectAccountThunkState = DeviceRootState & ConnectPopupStateRootState;
type ConnectPopupVerifySelectAccountThunkDeps = {
    actions: LockDeviceDep;
};

export const connectPopupVerifySelectAccountThunk = createThunk<
    void,
    { accountIndex: number; accountTypeKey: string },
    {
        state: ConnectPopupVerifySelectAccountThunkState;
        extra: ConnectPopupVerifySelectAccountThunkDeps;
    }
>(
    `${CONNECT_POPUP_MODULE}/verifySelectAccountThunk`,
    async ({ accountIndex, accountTypeKey }, { dispatch, getState, extra }) => {
        dispatch(extra.actions.lockDevice(false));

        const isTarget = (c: SelectAccountCandidate) =>
            c.accountIndex === accountIndex && c.accountTypeKey === accountTypeKey;

        const device = selectSelectedDevice(getState());
        const call = selectConnectPopupCall(getState());
        if (!device || call?.state !== 'select-account') return;
        const candidate = call.candidates.find(isTarget);
        if (!candidate?.address && !candidate?.xpub) return;

        const patchCandidate = (patch: Partial<SelectAccountCandidate>) => {
            const cur = selectConnectPopupCall(getState());
            if (cur?.state !== 'select-account') return;
            dispatch(
                connectPopupActions.updateSelectAccount({
                    candidates: cur.candidates.map(c => (isTarget(c) ? { ...c, ...patch } : c)),
                }),
            );
        };

        patchCandidate({ verifying: true });

        const deviceParams = {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        };

        const { networkType } = getNetwork(candidate.symbol);
        const accountType =
            call.options.accountTypeTabs.find(tab => tab.key === candidate.accountTypeKey)
                ?.accountType ?? 'normal';

        try {
            // The `xpub` flow has no on-screen address to compare — verification just confirms the
            // export on-device, same call as the initial account derivation (see getPublicKey.ts).
            if (candidate.xpub) {
                const res = await getPublicKeyForNetworkType({
                    device: deviceParams,
                    networkType,
                    path: candidate.path,
                    coin: candidate.symbol,
                    showOnTrezor: true,
                    derivationType: getDerivationType(accountType),
                });
                if (!res.success) {
                    console.error('connectPopupVerifySelectAccountThunk (xpub)', res.error);
                }
                patchCandidate({ verifying: false, validated: res.success ? 'valid' : 'failed' });

                return;
            }

            // Cardano's stakingPath is keyed by the BIP44 account index. In the UTXO 'manual'
            // address phase, `candidate.accountIndex` is repurposed as the used-address list index
            // (see SelectAccountCandidate) — the real account index is `call.manualAccountIndex`.
            const cardanoAccountIndex =
                call.manualPhase === 'address'
                    ? (call.manualAccountIndex ?? candidate.accountIndex)
                    : candidate.accountIndex;

            const res = await getAddressForNetworkType({
                device: deviceParams,
                networkType,
                path: candidate.path,
                coin: candidate.symbol,
                showOnTrezor: true,
                cardano:
                    networkType === 'cardano'
                        ? {
                              addressParameters: getAddressParameters(
                                  { index: cardanoAccountIndex },
                                  candidate.path,
                              ),
                              protocolMagic: getProtocolMagic(candidate.symbol),
                              networkId: getNetworkId(),
                              derivationType: getDerivationType(accountType),
                          }
                        : undefined,
            });

            if (!res.success) {
                console.error('connectPopupVerifySelectAccountThunk', res.error);
            }
            patchCandidate({
                verifying: false,
                validated: res.success ? 'valid' : 'failed',
                mac: res.success ? res.payload.mac : undefined,
            });
        } catch (error) {
            console.error('connectPopupVerifySelectAccountThunk', error);
            patchCandidate({ verifying: false, validated: 'failed' });
        }
    },
);

// Finalizes the picker. The selectAccount methodHook is awaiting `getPermissionDeferred`; on cancel
// we reject it (the call thunk's catch maps Method_Cancel to the final error response), on confirm
// we override the placeholder method response with the user's selection via `getPopupCallDeferred`
// and unblock the hook (which then flips the picker into its `exported` phase). Mirrors
// ConnectAddressConfirmation: after export the modal stays open so the user can keep verifying the
// exported addresses on device, and only `finishCall` (Close) actually closes it.
type ConnectPopupResolveSelectAccountThunkState = ConnectPopupStateRootState;

export const connectPopupResolveSelectAccountThunk = createThunk<
    void,
    { confirmed: boolean },
    {
        state: ConnectPopupResolveSelectAccountThunkState;
    }
>(`${CONNECT_POPUP_MODULE}/resolveSelectAccountThunk`, ({ confirmed }, { dispatch, getState }) => {
    const call = selectConnectPopupCall(getState());
    if (call?.state !== 'select-account') return;

    // Already exported -> this is a "Close": the response was sent on confirm, just close.
    if (call.exported) {
        dispatch(connectPopupActions.finishCall());

        return;
    }

    // Not exported + not confirmed -> "Cancel": reject the pending method call.
    if (!confirmed) {
        getPermissionDeferred().reject(TypedError('Method_Cancel'));
        dispatch(connectPopupActions.finishCall());

        return;
    }

    // Always an array, even for a 'single' selection — mirrors eth_requestAccounts. `address`
    // and `xpub` are mutually exclusive per candidate (see SelectAccountCandidate).
    const payload = call.candidates
        .filter(c => c.selected && (c.address || c.xpub))
        .map(c => ({
            symbol: c.symbol,
            path: c.path,
            address: c.address,
            xpub: c.xpub,
            // undefined for custom (non-built-in) account-type tabs — no real AccountType to report
            accountType: call.options.accountTypeTabs.find(tab => tab.key === c.accountTypeKey)
                ?.accountType,
            mac: c.mac,
        }));

    // Export: deliver the selection to the 3rd-party app and flip the picker into its `exported`
    // phase, then unblock the methodHook. Do NOT finishCall — keep the modal open so the user can
    // keep verifying the exported addresses on device (mirrors ConnectAddressConfirmation).
    getPopupCallDeferred().resolve({
        success: true,
        payload,
    } as Awaited<CallMethodAnyResponse>);
    dispatch(connectPopupActions.updateSelectAccount({ exported: true }));
    getPermissionDeferred().resolve();
});

export const connectPopupCancelThunk = createThunk<void, { error?: string; callId?: string }, void>(
    `${CONNECT_POPUP_MODULE}/cancelThunk`,
    ({ error, callId }, { dispatch }) => {
        getPermissionDeferred().reject(TypedError('Method_Cancel'));
        TrezorConnect.cancel({ reason: error, callId });
        // todo: probably not needed to call explicitly anymore
        dispatch(deviceActions.removeButtonRequests({}));

        dispatch(connectPopupActions.finishCall());

        // Resolve the popup-call deferred directly so the cancel response
        // reaches the caller immediately.  Without this, the response
        // depends on TrezorConnect.cancel() propagating through the
        // internal core, interrupting the device, and eventually causing
        // the catch block in connectPopupCallThunkInner to resolve the
        // deferred — which may not happen reliably (e.g. the device
        // interrupt doesn't complete, or the Suite popup tab closes
        // before RESPONSE_EVENT is sent).
        getPopupCallDeferred().resolve({
            success: false,
            error: serializeError(TypedError('Method_Interrupted')),
        });
    },
);
