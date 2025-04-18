import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';
import { desktopApi } from '@trezor/suite-desktop-api';

import { connectPopupCallThunk, connectPopupCancelThunk } from './connectPopupThunks';
import { CALL_SOURCE_DESKTOP_WS } from './connectPopupTypes';

// Desktop only - not directly exported by package
export const connectPopupDesktopInitThunk = createThunk(
    `@common/connect-popup/initPopupThunk`,
    async (_, { dispatch }) => {
        if (desktopApi.available && (await desktopApi.connectPopupEnabled())) {
            desktopApi.on('connect-popup/call', async params => {
                const response = await dispatch(
                    connectPopupCallThunk({
                        method: params.method as keyof typeof TrezorConnect,
                        payload: params.payload,
                        source: {
                            type: CALL_SOURCE_DESKTOP_WS,
                            process: params.process ?? {
                                name: 'Unknown',
                                fullPath: 'Unknown',
                                warning: true,
                            },
                            origin: params.origin,
                            manifest: params.manifest,
                        },
                    }),
                ).unwrap();
                desktopApi.connectPopupResponse({ ...response, id: params.id });
            });
            desktopApi.on('connect-popup/cancel', params => {
                dispatch(connectPopupCancelThunk(params));
            });
            desktopApi.connectPopupReady();
        }
    },
);
