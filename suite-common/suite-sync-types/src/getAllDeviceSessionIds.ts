import { type StaticSessionId } from '@trezor/connect';

export type GetAllDeviceSessionIdsDep = {
    getAllDeviceSessionIds: () => StaticSessionId[];
};
