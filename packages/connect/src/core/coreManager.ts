import { EventEmitter } from 'events';
import { createDeferred, Deferred } from '@trezor/utils';
import { CORE_EVENT, CoreEventMessage } from '../events';
import { ConnectSettings } from '../types';

// TODO NOTE: types are temporary, once Core will be moved from index to separate file it could by imported directly
type CoreInstance = EventEmitter & {
    init: (
        settings: ConnectSettings,
        onCoreEvent: (message: CoreEventMessage) => void,
        ...rest: any[]
    ) => Promise<void>;
    dispose: () => any;
};

// TODO NOTE: argument `core` is temporary, reason same as above
export const initCoreManager = <Core extends CoreInstance>(core: Core) => {
    type CoreState = {
        initPromise?: Promise<Core>;
        core?: Core;
    };

    const state: CoreState = {};

    // resolved by getOrInitCore or rejected by dispose
    let initDfd: Deferred<Core> | undefined;

    // get or init `Core` instance
    const getOrInitCore = (
        ...[settings, onCoreEvent, ...rest]: Parameters<Core['init']>
    ): Promise<Core> => {
        // return already initialized Core
        if (state.core) return Promise.resolve(state.core);
        // return loading Promise<Core>
        if (state.initPromise) return state.initPromise;

        // do not send any event until Core is fully loaded
        // DeviceList emits TRANSPORT and DEVICE events if pendingTransportEvent is set
        const eventThrottle = async (...args: Parameters<typeof onCoreEvent>) => {
            if (state.initPromise) {
                // wait for init success or failure before event propagation
                const core = await state.initPromise.catch(() => {});
                // do not propagate events in case of failure
                if (!core) return;
            }
            onCoreEvent(...args);
        };

        // create initDfd
        const dfd = createDeferred<Core>();
        initDfd = dfd;
        state.initPromise = dfd.promise;
        // try to init new Core instance
        core.init(settings, eventThrottle, ...rest)
            .then(() => {
                // Core initialized successfully, disable throttle
                core.on(CORE_EVENT, onCoreEvent);
                core.off(CORE_EVENT, eventThrottle);

                // update state and resolve initPromise
                state.core = core;
                dfd.resolve(core);
            })
            .catch(dfd.reject)
            .finally(() => {
                initDfd = undefined;
                delete state.initPromise;
            });

        return dfd.promise;
    };

    const dispose = () => {
        // reject running initPromise
        initDfd?.reject(new Error('Core disposed'));
        initDfd = undefined;

        // dispose initialized Core
        state.core?.dispose();

        // clear state
        delete state.initPromise;
        delete state.core;
    };

    return {
        getOrInitCore,
        getCore: () => state.core,
        getInitPromise: () => state.initPromise,
        dispose,
    };
};
