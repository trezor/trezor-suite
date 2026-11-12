import type { SubscribeToForeground } from '@suite-common/earn-staking';

export const subscribeToWindowForeground: SubscribeToForeground = listener => {
    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') listener();
    };

    window.addEventListener('focus', listener);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
        window.removeEventListener('focus', listener);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
};
