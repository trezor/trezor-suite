import type { WardProvider } from '@trezor/ward';

import type { Log } from './logging';

export const forwardingDelay = async (log: Log, hop: string, enabled = false) => {
    if (!enabled) return;
    log('forward.delay', { hop, delayMs: 1000 });
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
};

export const pacedStorage = (storage: WardProvider, log: Log, enabled: boolean): WardProvider =>
    enabled
        ? new Proxy(storage, {
              get(target, name) {
                  const method: unknown = Reflect.get(target, name);
                  if (typeof method !== 'function') return method;
                  if (name === 'dispose') return method.bind(target);

                  return async (...args: unknown[]) => {
                      await forwardingDelay(log, `wardd -> storage.${String(name)}`, true);
                      try {
                          return await Reflect.apply(method, target, args);
                      } finally {
                          await forwardingDelay(log, `storage.${String(name)} -> wardd`, true);
                      }
                  };
              },
          })
        : storage;
