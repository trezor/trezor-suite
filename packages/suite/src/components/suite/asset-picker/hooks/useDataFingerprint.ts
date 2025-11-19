import { useMemo } from 'react';

import { getFingerprint } from 'src/utils/wallet/getFingerprint';

export function useDataFingerprint(data: unknown[]) {
    return useMemo(() => getFingerprint(data), [data]);
}
