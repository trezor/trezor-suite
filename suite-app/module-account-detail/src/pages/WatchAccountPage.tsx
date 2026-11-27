import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { PageHeader, WatchAccount, useLayout } from '@trezor/suite';

export const WatchAccountPage = () => {
    const { translationString } = useTranslation();
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(translationString('TR_WATCH_ACCOUNT_TITLE'), pageHeader);

    return <WatchAccount />;
};
