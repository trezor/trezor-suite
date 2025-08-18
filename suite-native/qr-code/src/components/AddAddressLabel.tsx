import { Pressable } from 'react-native';

import { HStack, Text, useBottomSheetModal } from '@suite-native/atoms';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import type { StaticSessionId } from '@trezor/connect';

import { AddressLabelBottomSheet } from './AddressLabelBottomSheet';

type AddAddressLabelProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export const AddAddressLabel = ({
    address,
    deviceStaticSessionId,
    label,
}: AddAddressLabelProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <Pressable onPress={openModal}>
                <HStack spacing="sp8" justifyContent="center">
                    <Text textAlign="center" color="textPrimaryDefault" testID="@receive/addLabel">
                        {label ?? <Translation id="labeling.addLabel" />}
                    </Text>
                    <Icon name="pencil" color="textPrimaryDefault" size={iconSizes.mediumLarge} />
                </HStack>
            </Pressable>
            <AddressLabelBottomSheet
                ref={bottomSheetRef}
                onClose={closeModal}
                address={address}
                deviceStaticSessionId={deviceStaticSessionId}
                label={label}
            />
        </>
    );
};
