import { createThunk } from '@suite-common/redux-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { connectPopupCallThunk } from './connectPopupThunks';

// Desktop only - not directly exported by package
export const connectPopupDesktopInitThunk = createThunk(
    `@common/connect-popup/initPopupThunk`,
    async (_, { dispatch }) => {
        if (desktopApi.available && (await desktopApi.connectPopupEnabled())) {
            desktopApi.on('connect-popup/call', async params => {
                const response = await dispatch(
                    connectPopupCallThunk(
                        // @ts-expect-error: params in desktopApi are not fully typed
                        params,
                    ),
                ).unwrap();
                desktopApi.connectPopupResponse({ ...response, id: params.id });
            });
            desktopApi.connectPopupReady();
        }
    },
);
