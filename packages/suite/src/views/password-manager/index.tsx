import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout } from 'src/hooks/suite';

import { PasswordManager } from './PasswordManager/PasswordManager';
import { Translation } from '../../components/suite/Translation';

const PasswordManagerView = () => {
    useLayout(
        'Password manager',
        <PageHeader>
            <BasicName>
                <Translation id="TR_PASSWORD_MANAGER" />
            </BasicName>
        </PageHeader>,
    );

    return <PasswordManager />;
};

export default PasswordManagerView;
