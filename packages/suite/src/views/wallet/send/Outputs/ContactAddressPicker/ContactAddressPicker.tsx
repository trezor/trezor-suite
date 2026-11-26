import { selectIsContactsAvailable } from '@suite/contacts';
import { getContactsSlip44 } from '@suite-common/contacts';
import { selectIsDeviceUsingPassphrase } from '@suite-common/device';

import { useSelector } from '#src/hooks/suite';
import { useSendFormContext } from '#src/hooks/wallet';

import { ContactAddressDropdown } from './ContactAddressDropdown';

type ContactAddressPickerProps = {
    outputId: number;
};

/**
 * Pays a contact from the send form. Only the standard wallet pays contacts, as only its Trezor
 * keeps them, and only from a Bitcoin account.
 */
export const ContactAddressPicker = ({ outputId }: ContactAddressPickerProps) => {
    const { account } = useSendFormContext();
    const isContactsAvailable = useSelector(selectIsContactsAvailable);
    const isPassphraseWallet = useSelector(selectIsDeviceUsingPassphrase);

    if (!isContactsAvailable || isPassphraseWallet || getContactsSlip44(account) === undefined) {
        return null;
    }

    return <ContactAddressDropdown outputId={outputId} />;
};
