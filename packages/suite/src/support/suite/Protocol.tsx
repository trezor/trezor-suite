import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { desktopApi } from '@trezor/suite-desktop-api';

import { isWeb, isDesktop } from '@suite-utils/env';
import { getProtocolInfo } from '@suite-utils/parseUri';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as protocolActions from '@suite-actions/protocolActions';
import { PROTOCOL_SCHEME } from '@suite-constants/protocol';

const Protocol = () => {
    const { addToast, saveCoinProtocol } = useActions({
        addToast: notificationActions.addToast,
        saveCoinProtocol: protocolActions.saveCoinProtocol,
    });

    const handleProtocolRequest = useCallback(
        (uri: string) => {
            const protocolInfo = getProtocolInfo(uri);
            switch (protocolInfo?.scheme) {
                case PROTOCOL_SCHEME.BITCOIN: {
                    const { scheme, amount, address } = protocolInfo;
                    saveCoinProtocol(scheme, address, amount);
                    addToast({
                        type: 'coin-scheme-protocol',
                        address,
                        scheme,
                        amount,
                        autoClose: false,
                    });
                    break;
                }
                default:
                    break;
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
            navigator.registerProtocolHandler(
                'bitcoin',
                `${window.location.origin}${process.env.ASSET_PREFIX ?? ''}/?uri=%s`,
                // @ts-ignore - title is deprecated but it is recommended to be set because of backwards-compatibility
                'Bitcoin / Trezor Suite',
            );
        }

        if (isDesktop()) {
            desktopApi.on('protocol/open', handleProtocolRequest);
        }
    }, [handleProtocolRequest]);

    return null;
};

export default Protocol;
