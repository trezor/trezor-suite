import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import {
    type ContactWardStatus,
    selectContactWardStatuses,
    selectPayableContacts,
} from '@suite-common/contacts';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import { Column, Dropdown, type DropdownMenuItemProps, Text } from '@trezor/components';
import { AddressBookIcon } from '@trezor/icons';

import { useSelector } from '#src/hooks/suite';
import { useSendFormContext } from '#src/hooks/wallet';

const NO_WARD_STATUSES: Record<string, ContactWardStatus> = {};

type ContactAddressDropdownProps = {
    outputId: number;
};

/**
 * Fills the output with an address the contact's Trezor attested and nobody paid yet and, if the
 * output has no label, labels it with the contact's name. The payer's Trezor then shows that name
 * for the output.
 */
export const ContactAddressDropdown = ({ outputId }: ContactAddressDropdownProps) => {
    const { account, control, setValue, getValues, composeTransaction } = useSendFormContext();
    const staticSessionId = useSelector(selectDeviceStaticSessionId);
    const payableContacts = useSelector(state => selectPayableContacts(state, account.key));
    const wardStatuses = useSelector(state =>
        staticSessionId ? selectContactWardStatuses(state, staticSessionId) : NO_WARD_STATUSES,
    );
    const outputs = useWatch({ control, name: 'outputs' });

    const addressInputName = `outputs.${outputId}.address` as const;
    const labelInputName = `outputs.${outputId}.label` as const;
    // Another output of this transaction may already pay a contact address. It counts as paid only
    // after the broadcast, so it is left out here.
    const otherOutputAddresses = outputs
        .filter((_output, index) => index !== outputId)
        .map(output => output.address);

    const payContact = (name: string, address: string) => {
        setValue(addressInputName, address, { shouldValidate: true, shouldDirty: true });

        if (!getValues(labelInputName)) {
            setValue(labelInputName, name, { shouldDirty: true });
        }

        composeTransaction(addressInputName);
    };

    const items = payableContacts.flatMap(({ npub, name, addresses }): DropdownMenuItemProps[] => {
        const address = addresses.find(
            contactAddress => !otherOutputAddresses.includes(contactAddress),
        );

        if (address === undefined) {
            return [];
        }

        return [
            {
                label: (
                    <Column alignItems="flex-start">
                        <Text typographyStyle="body-sm">{name}</Text>
                        {wardStatuses[npub] === 'queued' && (
                            <Text typographyStyle="body-xs" intent="warning">
                                <Translation id="TR_CONTACTS_PICKER_QUEUED" />
                            </Text>
                        )}
                    </Column>
                ),
                onClick: () => payContact(name, address),
                'data-testid': `@send/contact-picker/${name}`,
            },
        ];
    });

    if (items.length === 0) {
        return null;
    }

    return (
        <Dropdown
            icon={AddressBookIcon}
            iconSize="small"
            intent="neutral"
            priority="secondary"
            items={items}
            tooltip={{ content: <Translation id="TR_CONTACTS_PAY_CONTACT" /> }}
            data-testid="@send/contact-picker"
        />
    );
};
