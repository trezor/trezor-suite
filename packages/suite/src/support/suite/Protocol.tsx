import { useCallback, useEffect } from 'react';

import { selectURLSearchParams } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { isDesktop, isWeb } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import * as protocolActions from 'src/actions/suite/protocolActions';
import { useSelector } from 'src/hooks/suite';

const Protocol = () => {
    const dispatch = useDispatch();

    const handleProtocolRequestThunk = useCallback(
        (uri: string) => {
            dispatch(protocolActions.handleProtocolRequestThunk(uri));
        },
        [dispatch],
    );

    const searchParams = useSelector(selectURLSearchParams);

    const processSearch = useCallback(() => {
        if (searchParams) {
            const uri = searchParams.get('uri');
            if (uri) {
                handleProtocolRequestThunk(uri);
            }
        }
    }, [handleProtocolRequestThunk, searchParams]);

    useEffect(() => {
        processSearch();
    }, [processSearch, searchParams]);

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
            desktopApi.on('protocol/open', handleProtocolRequestThunk);

            return () => desktopApi.removeAllListeners('protocol/open');
        }
    }, [handleProtocolRequestThunk]);

    return null;
};

export default Protocol;
