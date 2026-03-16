import { type TrezorDevice } from '@suite-common/suite-types';
import { type StaticSessionId } from '@trezor/connect';

export type GetDeviceForStaticSessionId = (
    deviceStaticSessionId: StaticSessionId,
) => TrezorDevice | null;

export type GetDeviceForStaticSessionIdDep = {
    getDeviceForStaticSessionId: GetDeviceForStaticSessionId;
};
