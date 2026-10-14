import { type GetThpSettingsDep } from '@suite-common/thp';
import { asGetter } from '@trezor/dependency-injection';

export const mockGetThpSettings = (): GetThpSettingsDep['getThpSettings'] =>
    asGetter(() => ({
        pairingMethods: ['CodeEntry'],
    }));
