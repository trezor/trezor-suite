import { useMemo } from 'react';

import { getFingerprint } from 'src/utils/wallet/getFingerprint';

export function useDataFingerprint(data: any[]) {
    return useMemo(() => getFingerprint(data), [data]);
}
