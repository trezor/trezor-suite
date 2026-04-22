import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    Button,
    CardDivider,
    HStack,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';

type TronAccountActivationInfoProps = {
    accountKey: AccountKey;
};

export const TronAccountActivationInfo = ({ accountKey }: TronAccountActivationInfoProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    if (!account || account.networkType !== 'tron') return null;

    const normalLevel = feeLevels.normal;

    if (!normalLevel || normalLevel.type === 'error') return null;

    const accountActivationFee =
        'accountActivationFee' in normalLevel ? normalLevel.accountActivationFee : undefined;

    if (!accountActivationFee) return null;

    return (
        <>
            <CardDivider />
            <HStack justifyContent="space-between" alignItems="center">
                <Text variant="body-sm">
                    <Translation id="moduleSend.tron.accountActivationFee" />
                </Text>
                <HStack spacing="sp4" alignItems="center">
                    <CryptoAmountFormatter
                        variant="body-sm"
                        color="contentPrimary"
                        value={accountActivationFee}
                        symbol={account.symbol}
                        isBalance={false}
                        isDiscreetText={false}
                    />
                    <Pressable onPress={openModal}>
                        <Icon name="info" size="medium" color="contentSecondary" />
                    </Pressable>
                </HStack>
            </HStack>
            <BottomSheetModal ref={bottomSheetRef}>
                <VStack spacing="sp24">
                    <VStack spacing="sp8">
                        <Text variant="headline-sm">
                            <Translation id="moduleSend.tron.accountActivationFeeTitle" />
                        </Text>
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleSend.tron.accountActivationFeeDescription" />
                        </Text>
                    </VStack>
                    <Button onPress={closeModal}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheetModal>
        </>
    );
};
