import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { desktopApi } from '@trezor/suite-desktop-api';

import { isWeb, isDesktop } from '@suite-utils/env';
import { getProtocolInfo, isProtocolScheme } from '@suite-utils/protocol';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as protocolActions from '@suite-actions/protocolActions';

const Protocol = () => {
    const { addToast, saveCoinProtocol } = useActions({
        addToast: notificationActions.addToast,
        saveCoinProtocol: protocolActions.saveCoinProtocol,
    });

    const handleProtocolRequest = useCallback(
        (uri: string) => {
            const protocol = getProtocolInfo(uri);

            if (protocol && isProtocolScheme(protocol.scheme)) {
                const { scheme, amount, address } = protocol;

                saveCoinProtocol(scheme, address, amount);
                addToast({
                    type: 'coin-scheme-protocol',
                    address,
                    scheme,
                    amount,
                    autoClose: false,
                });
            }
        },
        [addToast, saveCoinProtocol],
    );

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
            );
        }

        if (isDesktop()) {
            desktopApi.on('protocol/open', handleProtocolRequest);
        }
    }, [handleProtocolRequest]);

    return null;
};

export default Protocol;
