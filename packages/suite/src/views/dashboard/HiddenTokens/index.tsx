import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { HiddenTokensList } from './HiddenTokensList';

export const HiddenTokens = () => {
    const { translationString } = useTranslation();
    const pageHeader = useMemo(() => <PageHeader />, []);

    useLayout(translationString('TR_HIDDEN_TOKENS'), pageHeader);

    return <HiddenTokensList />;
};
