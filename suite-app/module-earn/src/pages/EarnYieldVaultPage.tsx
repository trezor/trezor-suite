import { useMemo } from 'react';

import { YieldVaultDetail, YieldVaultDetailPageHeader, useLayout } from '@trezor/suite';

export const EarnYieldVaultPage = () => {
    const pageHeader = useMemo(() => <YieldVaultDetailPageHeader />, []);

    useLayout('Earn', pageHeader);

    return <YieldVaultDetail />;
};
