import { Translation } from '@suite/intl';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout } from 'src/hooks/suite';

import { DappBrowser } from './DappBrowser';

export const DappBrowserView = () => {
    useLayout(
        'dApp browser',
        <PageHeader>
            <BasicName>
                <Translation id="TR_DAPP_BROWSER" />
            </BasicName>
        </PageHeader>,
    );

    return <DappBrowser />;
};
