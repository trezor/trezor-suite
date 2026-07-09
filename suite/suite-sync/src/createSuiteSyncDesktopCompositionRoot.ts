import { createConsole, createConsoleFormatter, createConsoleStoreOutput } from '@evolu/common';
import { consoleEntryOrErrorBroadcastChannelName } from '@evolu/common/local-first';
import { createEvoluDeps, createRun } from '@evolu/web';
import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { selectIsTorEnabled } from '@suite/tor';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { toGetter } from '@suite-common/dependency-injection';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    addSuiteSyncRelayConnection,
    createSuiteSyncCompositionRoot,
    getSuiteSyncRelayConnectionFromEvoluLog,
    removeSuiteSyncRelayConnection,
    setSuiteSyncRelayConnection,
} from '@suite-common/suite-sync';
import {
    createEvoluErrorHandler,
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { type FetchDep } from '@suite-common/suite-sync-quota-manager';
import { type OnStorageEnsured, type SuiteSync } from '@suite-common/suite-sync-types';
import { type TrezorConnect } from '@trezor/connect';

import { createOnSharedWorkerUnsupported } from './createOnSharedWorkerUnsupported';
import { suiteSyncErrorHandler } from './suiteSyncErrorHandler';
import { createTurnOnDesktopSuiteSync } from './turnOnDesktopSuiteSync';

type SuiteSyncDesktopCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
    onStorageEnsured: OnStorageEnsured;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    DesktopAnalyticsDep &
    FetchDep;

const stringifyEvoluConsoleEntry = (entry: unknown) =>
    JSON.stringify(entry, (_key, value) => {
        if (value instanceof Error) {
            return {
                message: value.message,
                name: value.name,
            };
        }

        return value;
    });

export const createSuiteSyncDesktopCompositionRoot = (
    deps: SuiteSyncDesktopCompositionRootDeps,
): SuiteSync => {
    const evoluConsoleStoreOutput = createConsoleStoreOutput();

    const console = createConsole({
        level: 'debug',
        output: evoluConsoleStoreOutput,
        formatter: createConsoleFormatter()({ timestampFormat: 'absolute' }),
    });

    const evoluConsoleBroadcastChannel = new BroadcastChannel(
        consoleEntryOrErrorBroadcastChannelName,
    );
    evoluConsoleBroadcastChannel.onmessage = ({ data }) => {
        globalThis.console.log('_____ suiteSync.evoluConsoleBroadcastChannel:onmessage', data);

        if (typeof data !== 'object' || data === null || !('type' in data)) return;

        if (data.type !== 'ConsoleEntry' || !('entry' in data)) return;

        globalThis.console.log('_____ suiteSync.evoluConsoleEntry', data.entry);
        globalThis.console.log(
            '_____ suiteSync.evoluConsoleEntry:stringified',
            stringifyEvoluConsoleEntry(data.entry),
        );

        const relayConnectionEvents = getSuiteSyncRelayConnectionFromEvoluLog(data.entry);

        globalThis.console.log('_____ suiteSync.relayConnectionEvents', relayConnectionEvents);

        relayConnectionEvents.forEach(event => {
            if (event.type === 'add') {
                globalThis.console.log('_____ suiteSync.relayConnection:add', event);

                deps.dispatch(addSuiteSyncRelayConnection({ url: event.url }));

                return;
            }

            if (event.type === 'remove') {
                globalThis.console.log('_____ suiteSync.relayConnection:remove', event);

                deps.dispatch(removeSuiteSyncRelayConnection({ url: event.url }));

                return;
            }

            globalThis.console.log('_____ suiteSync.relayConnection:status', event.connection);

            deps.dispatch(setSuiteSyncRelayConnection(event.connection));
        });
    };

    const evoluDeps = createEvoluDeps({
        console,
        onSharedWorkerUnsupported: createOnSharedWorkerUnsupported({
            dispatch: deps.dispatch,
        }),
    });

    const run = createRun(evoluDeps);
    // This sets up Evolu as a SuiteSync Storage. We provide a factory that
    // accepts `suiteSyncErrorHandler` and creates the evolu instance accordingly.
    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorageFactory({
            createEvoluInstance: createEvoluInstanceFactory({ run }),
        }),
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        getIsTorEnabled: toGetter(deps.getState, selectIsTorEnabled),
        analytics: deps.analytics,
        subscribeError: suiteSyncInternalErrorHandler => {
            evoluDeps.evoluError.subscribe(
                createEvoluErrorHandler(evoluDeps.evoluError, suiteSyncInternalErrorHandler),
            );
        },
        suiteSyncUncontrolledErrorHandler: ({ device, error }) =>
            suiteSyncErrorHandler({
                error,
                dispatch: deps.dispatch,
                deviceStaticSessionId: device?.state?.staticSessionId ?? null,
            }),
    });

    return {
        ...suiteSync,
        turnOnSuiteSync: createTurnOnDesktopSuiteSync({
            turnOnSuiteSync: suiteSync.turnOnSuiteSync,
            analytics: deps.analytics,
        }),
    };
};
