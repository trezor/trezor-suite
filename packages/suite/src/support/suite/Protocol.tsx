import { useEffect, useCallback } from 'react';

import { isWeb, isDesktop } from '@suite-utils/env';

const Protocol = () => {
    const handleProtocolRequest = useCallback(_ => {}, []);

    useEffect(() => {
        if (isWeb()) {
            navigator.registerProtocolHandler(
                'bitcoin',
                `${window.location.origin}${process.env.ASSET_PREFIX ?? ''}?uri=%s`,
                // @ts-ignore - title is deprecated but it is recommended to be set because of backwards-compatibility
                'Bitcoin / Trezor Suite',
            );
        }

        if (isDesktop()) {
            // @ts-ignore TS2339: Property 'desktopApi' does not exist on type 'Window & typeof globalThis'.
            window.desktopApi?.on('protocol/open', handleProtocolRequest);
        }
    }, [handleProtocolRequest]);

    return null;
};

export default Protocol;
