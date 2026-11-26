import { Contacts, selectIsContactsAvailable } from '@suite/contacts';
import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { PageHeader, useLayout, useSelector } from '@trezor/suite';

export const ContactsPage = () => {
    const isContactsAvailable = useSelector(selectIsContactsAvailable);

    useLayout('Contacts', <PageHeader />);

    // Debug mode can be turned off by a keyboard shortcut while the page is open, so the gate lives
    // here as well as on the sidebar item.
    if (!isContactsAvailable) {
        return (
            <Banner intent="warning" description={<Translation id="TR_CONTACTS_UNAVAILABLE" />} />
        );
    }

    return <Contacts />;
};
