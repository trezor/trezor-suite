import { Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BottomSheetModal, Button, Card, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Resource } from './Resource';
import { ResourceInfoItem } from './ResourceInfoItem';

type TronResourcesProps = {
    accountKey: AccountKey;
};

const containerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
}));

export const TronResources = ({ accountKey }: TronResourcesProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account || account.networkType !== 'tron') return null;

    const { tronResources } = account.misc;

    if (!tronResources) return null;

    const {
        availableStakedBandwidth,
        availableFreeBandwidth,
        totalStakedBandwidth,
        totalFreeBandwidth,
        availableEnergy,
        totalEnergy,
    } = tronResources;

    const availableBandwidth = availableStakedBandwidth + availableFreeBandwidth;
    const totalBandwidth = totalStakedBandwidth + totalFreeBandwidth;

    return (
        <View style={applyStyle(containerStyle)}>
            <Pressable onPress={openModal}>
                <Card>
                    <VStack spacing="sp16">
                        <Resource
                            label={
                                <Translation id="moduleAccounts.tronResources.bandwidth.label" />
                            }
                            available={availableBandwidth}
                            total={totalBandwidth}
                        />
                        <Resource
                            label={<Translation id="moduleAccounts.tronResources.energy.label" />}
                            available={availableEnergy}
                            total={totalEnergy}
                        />
                    </VStack>
                </Card>
            </Pressable>
            <BottomSheetModal ref={bottomSheetRef}>
                <VStack spacing="sp24">
                    <VStack spacing="sp20">
                        <ResourceInfoItem
                            label={
                                <Translation id="moduleAccounts.tronResources.bandwidth.label" />
                            }
                            description={
                                <Translation id="moduleAccounts.tronResources.bandwidth.description" />
                            }
                        />
                        <ResourceInfoItem
                            label={<Translation id="moduleAccounts.tronResources.energy.label" />}
                            description={
                                <Translation id="moduleAccounts.tronResources.energy.description" />
                            }
                        />
                    </VStack>
                    <Button onPress={closeModal}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheetModal>
        </View>
    );
};
