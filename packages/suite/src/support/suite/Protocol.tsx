import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { desktopApi } from '@trezor/suite-desktop-api';

import { isWeb, isDesktop } from '@trezor/env-utils';
import { useActions } from '@suite-hooks';
import * as protocolActions from '@suite-actions/protocolActions';

const Protocol = () => {
    const { handleProtocolRequest } = useActions({
        handleProtocolRequest: protocolActions.handleProtocolRequest,
    });

    const { search } = useLocation();
    useEffect(() => {
        if (search) {
            const query = new URLSearchParams(search);
            const uri = query.get('uri');
            if (uri) {
                handleProtocolRequest(uri);
            }
        }
    }, [search, handleProtocolRequest]);

    useEffect(() => {
        if (isWeb() && navigator.registerProtocolHandler) {
            // only 'bitcoin' crypto uri scheme is permitted in browser environment
            navigator.registerProtocolHandler(
                'bitcoin',
                `${window.location.origin}${process.env.ASSET_PREFIX ?? ''}/?uri=%s`,
                // @ts-expect-error deprecated but required for Firefox <= 78, Chrome <= 87
                'Trezor Suite - Bitcoin',
            );
        }

        if (isDesktop()) {
            desktopApi.on('protocol/open', handleProtocolRequest);
        }
    }, [handleProtocolRequest]);

    return null;
};

export default Protocol;
