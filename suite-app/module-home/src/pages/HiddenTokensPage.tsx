import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { HiddenTokensList, PageHeader, useLayout } from '@trezor/suite';

export const HiddenTokensPage = () => {
    const { translationString } = useTranslation();
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(translationString('TR_HIDDEN_TOKENS'), pageHeader);

    return <HiddenTokensList />;
};
