import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/local-first-storage';
import { HStack, Text, useBottomSheetModal } from '@suite-native/atoms';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import type { StaticSessionId } from '@trezor/connect';

import { AddressLabelBottomSheet } from './AddressLabelBottomSheet';

type AddAddressLabelProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
};

export const AddAddressLabel = ({ address, deviceStaticSessionId }: AddAddressLabelProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const label = useSelector(
        (state: WithLabelingState) =>
            (address !== undefined
                ? selectAddressLabel({
                      state,
                      address,
                      deviceStaticSessionId,
                  })
                : null
            )?.label ?? null,
    );

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
