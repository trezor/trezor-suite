import { asGetter } from '@suite-common/dependency-injection';
import { type GetThpSettingsDep } from '@suite-common/thp';

export const mockGetThpSettings = (): GetThpSettingsDep['getThpSettings'] =>
    asGetter(() => ({
        pairingMethods: ['CodeEntry'],
    }));
