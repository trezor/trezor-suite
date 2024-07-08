import { useLayout } from 'src/hooks/suite';
import { PasswordManager } from './PasswordManager/PasswordManager';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';

const PasswordManagerView = () => {
    useLayout('Password manager', () => (
        <PageHeader>
            <BasicName nameId="TR_PASSWORD_MANAGER" />
        </PageHeader>
    ));

    return <PasswordManager />;
};

export default PasswordManagerView;
