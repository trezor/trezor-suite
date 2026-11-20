import { Translation } from '@suite/intl';
import { BasicName, PageHeader, PasswordManager, useLayout } from '@trezor/suite';

export const PasswordManagerPage = () => {
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
