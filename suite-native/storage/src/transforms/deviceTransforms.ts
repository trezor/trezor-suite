import { A, pipe } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';

import { TrezorDevice } from '@suite-common/suite-types';

const serializeDevice = (device: TrezorDevice): Omit<TrezorDevice, 'path'> & { path: '' } => ({
    ...device,
    path: '',
    remember: true,
    temporaryRemember: false,
    connected: false,
    buttonRequests: [],
});

export const devicePersistTransform = createTransform<
    TrezorDevice[],
    Readonly<(Omit<TrezorDevice, 'path'> & { path: '' })[]>
>(
    inboundState =>
        pipe(
            inboundState,
            A.filter(device => !!device.remember && device.temporaryRemember !== true),
            A.map(serializeDevice),
        ),
    undefined,
    { whitelist: ['devices'] },
);
