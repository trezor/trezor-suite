import { Translation } from '@suite/intl';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout } from 'src/hooks/suite';

import { PasswordManager } from './PasswordManager';

const PasswordManagerView = () => {
    useLayout(
        'Password manager',
        <PageHeader>
            <BasicName>
                <Translation id="TR_PASSWORDS" />
            </BasicName>
        </PageHeader>,
    );

    return <PasswordManager />;
};

export default PasswordManagerView;
