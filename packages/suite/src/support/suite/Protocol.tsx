import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { isWeb, isDesktop } from '@suite-utils/env';
import { getProtocolInfo } from '@suite-utils/parseUri';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as protocolActions from '@suite-actions/protocolActions';

import type { CoinType } from '@trezor/components';

export enum PROTOCOL_SCHEME {
    BITCOIN = 'bitcoin',
}

export const PROTOCOL_TO_SYMBOL: { [key: string]: CoinType } = {
    [PROTOCOL_SCHEME.BITCOIN]: 'btc',
};

const Protocol = () => {
    const { addToast, saveCoinProtocol } = useActions({
        addToast: notificationActions.addToast,
        saveCoinProtocol: protocolActions.saveCoinProtocol,
    });

    const handleProtocolRequest = useCallback(
        uri => {
            const protocolInfo = getProtocolInfo(uri);

            if (protocolInfo?.scheme === PROTOCOL_SCHEME.BITCOIN) {
                saveCoinProtocol(protocolInfo.scheme, protocolInfo.address, protocolInfo.amount);

                addToast({
                    type: 'coin-scheme-protocol',
                    address: protocolInfo.address,
                    scheme: protocolInfo.scheme,
                    amount: protocolInfo.amount,
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
            navigator.registerProtocolHandler(
                'bitcoin',
                `${window.location.origin}${process.env.ASSET_PREFIX ?? ''}/?uri=%s`,
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
