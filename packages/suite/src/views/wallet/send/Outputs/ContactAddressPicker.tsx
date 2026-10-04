import { useEffect, useMemo, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Dropdown, type DropdownMenuItemProps, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { AddressBookIcon, WarningIcon } from '@trezor/icons';

import { getFreshContactAddressThunk } from 'src/actions/suite/contactsThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import {
    type Contact,
    contactPaymentNpub,
    selectContactsWallet,
    selectDeviceAuthority,
    selectIsContactsFeatureEnabled,
} from 'src/reducers/suite/contactsReducer';
import { isFreshAttestation } from 'src/utils/contacts/addressBuffer';
import { accountSlip44, isContactsAccount } from 'src/utils/contacts/coin';

type PickedAddress = {
    address: string;
    label: string;
};

type ContactAddressDropdownProps = {
    deviceState: StaticSessionId;
    slip44: number;
    outputId: number;
};

// Only a contact whose key was confirmed on this device is payable, and only with an attested
// address of theirs that I have not paid to and that no other output of this form uses. Other
// contacts are listed as disabled, with the reason, so the user knows to verify them or to ask them
// for an address first.
const ContactAddressDropdown = ({ deviceState, slip44, outputId }: ContactAddressDropdownProps) => {
    const contactsWallet = useSelector(state => selectContactsWallet(state, deviceState));
    const authority = useSelector(state => selectDeviceAuthority(state, deviceState));

    // The address and label this picker last put into the output, so the label can be cleared once
    // the user changes the address. A label the user typed is never tracked, so it is never cleared.
    const pickedRef = useRef<PickedAddress | null>(null);
    const dispatch = useDispatch();
    const { control, setValue, composeTransaction } = useSendFormContext();

    const addressName = `outputs.${outputId}.address` as const;
    const labelName = `outputs.${outputId}.label` as const;
    const outputs = useWatch({ control, name: 'outputs', defaultValue: [] });
    const currentAddress = useWatch({ control, name: addressName });
    const currentLabel = useWatch({ control, name: labelName });

    useEffect(() => {
        const picked = pickedRef.current;

        if (!picked) return;

        // Address validation lowercases an upper-case bech32 address after the fill, which is not
        // an edit.
        if ((currentAddress ?? '').toLowerCase() === picked.address.toLowerCase()) return;

        pickedRef.current = null;
        // Otherwise the contact's name would be saved as the label of a payment to someone else.
        if (currentLabel === picked.label) {
            setValue(labelName, '', { shouldDirty: true });
        }
    }, [currentAddress, currentLabel, labelName, setValue]);

    const verifiedAddresses = contactsWallet?.verifiedAddresses;
    const spentContactAddresses = contactsWallet?.spentContactAddresses;
    // Verifying the signatures is the expensive part, so it does not rerun when another output of the
    // form changes.
    const freshAttestations = useMemo(
        () =>
            verifiedAddresses && spentContactAddresses
                ? Object.values(verifiedAddresses).filter(attestation =>
                      isFreshAttestation({ attestation, slip44, spentContactAddresses }),
                  )
                : [],
        [verifiedAddresses, spentContactAddresses, slip44],
    );

    // These addresses are not spent until the broadcast, so the picker must skip them itself to
    // avoid paying one address twice in one transaction.
    const otherOutputAddresses = useMemo(
        () =>
            outputs
                .filter((output, index) => index !== outputId && !!output.address)
                .map(output => output.address),
        [outputs, outputId],
    );

    const npubsWithFreshAddress = useMemo(() => {
        const excludedAddresses = new Set(otherOutputAddresses);

        return new Set(
            freshAttestations
                .filter(attestation => !excludedAddresses.has(attestation.address))
                .map(attestation => attestation.npub),
        );
    }, [freshAttestations, otherOutputAddresses]);

    const contacts = Object.values(contactsWallet?.contacts ?? {});

    if (contacts.length === 0) return null;

    const pickContactAddress = async (npub: string) => {
        const freshAddress = await dispatch(
            getFreshContactAddressThunk({ npub, slip44, exclude: otherOutputAddresses }),
        ).unwrap();

        if (!freshAddress) return;

        // Set before the fill, so the effect above does not take the fill for a user edit.
        pickedRef.current = freshAddress;
        setValue(addressName, freshAddress.address, { shouldValidate: true, shouldDirty: true });
        setValue(labelName, freshAddress.label, { shouldDirty: true });
        composeTransaction(addressName);
    };

    const isVerified = (contact: Contact) => contactPaymentNpub(contact, authority) !== undefined;
    const isPayable = (contact: Contact) =>
        isVerified(contact) && npubsWithFreshAddress.has(contact.npub);

    const items: DropdownMenuItemProps[] = [...contacts]
        .sort((a, b) => Number(isPayable(b)) - Number(isPayable(a)))
        .map(contact => {
            if (isPayable(contact)) {
                return {
                    label: contact.label,
                    onClick: () => pickContactAddress(contact.npub),
                };
            }

            return {
                label: (
                    <>
                        {contact.label}{' '}
                        <Text
                            as="span"
                            typographyStyle="body-xs"
                            intent="neutral"
                            priority="secondary"
                        >
                            ·{' '}
                            <Translation
                                id={
                                    isVerified(contact)
                                        ? 'TR_CONTACTS_NO_FRESH_ADDRESS'
                                        : 'TR_CONTACTS_NOT_VERIFIED'
                                }
                            />
                        </Text>
                    </>
                ),
                isDisabled: true,
                iconRight: WarningIcon,
            };
        });

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

type ContactAddressPickerProps = {
    outputId: number;
};

/**
 * Pays a contact: fills the output with a fresh address the contact attested and their name as the
 * output label. Renders nothing unless contacts are enabled and the account's coin can be paid to a
 * contact (Bitcoin mainnet or testnet).
 */
export const ContactAddressPicker = ({ outputId }: ContactAddressPickerProps) => {
    const isContactsFeatureEnabled = useSelector(selectIsContactsFeatureEnabled);
    const { device } = useDevice();
    const { account } = useSendFormContext();

    const deviceState = device?.state?.staticSessionId;

    if (!isContactsFeatureEnabled || !isContactsAccount(account) || deviceState === undefined) {
        return null;
    }

    return (
        <ContactAddressDropdown
            deviceState={deviceState}
            slip44={accountSlip44(account)}
            outputId={outputId}
        />
    );
};
