import { createDeferred } from '@trezor/utils';

export const waitForPermissionGranted = async (triggerCallback: () => any) => {
    if (window.location.hostname === 'localhost') return true;
    const permission = await navigator.permissions
        // @ts-expect-error outdated type definitions
        .query({ name: 'local-network-access' })
        .then(p => p)
        .catch(() => undefined);

    console.log('Permission:', permission);

    // we don't know, permission API is not supported
    if (!permission) return true;

    // already either granted or denied, no user prompt is shown
    if (permission.state === 'granted') return true;
    if (permission.state === 'denied') return false;

    // permission.state === 'prompt' -> lets wait for user to decide

    const dfd = createDeferred<boolean>();
    permission.onchange = ev => {
        // @ts-expect-error outdated type definitions
        if (ev.target?.state !== 'prompt') {
            // @ts-expect-error outdated type definitions
            dfd.resolve(ev.target!.state === 'granted');
        }
    };

    triggerCallback();

    console.log('==== waiting for permission prompt response ====');

    return Promise.race([
        dfd.promise,
        // todo: add timeout? but how long? maybe user does not notice the dialogue, from this POV timeout makes sense
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 60_000)),
    ]);
};
