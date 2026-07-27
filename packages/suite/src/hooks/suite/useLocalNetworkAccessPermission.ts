import { useEffect, useState } from 'react';

import { isWeb } from '@trezor/env-utils';

export const useLocalNetworkAccessPermission = () => {
    const [localNetworkAccessPermission, setLocalNetworkAccessPermission] = useState<
        'unknown' | 'granted' | 'denied' | 'prompt'
    >('unknown');

    useEffect(() => {
        if (isWeb()) {
            navigator.permissions
                .query({
                    // @ts-expect-error outdated type definitions
                    name: 'local-network-access',
                })
                .then(permission => {
                    setLocalNetworkAccessPermission(permission.state);
                    permission.onchange = ev => {
                        if (ev?.target && 'state' in ev.target) {
                            // @ts-expect-error outdated type definitions
                            setLocalNetworkAccessPermission(ev.target.state);
                        }
                    };
                })
                .catch(() => {
                    // empty handler, we keep 'unknown'. Possibly unsupported browser version
                });
        }
    }, []);

    return {
        localNetworkAccessPermission,
    };
};
