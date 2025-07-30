import { useCallback, useEffect } from 'react';
import { FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountByKey,
    selectIsDeviceBackupRequired,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountDetailsCard } from '@suite-native/accounts';
import {
    AnimatedBox,
    ErrorMessage,
    InlineAlertBox,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    selectHasFirmwareAuthenticityCheckHardFailed,
    useConfirmOnTrezorController,
} from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { WalletBackupNotSetWarningBottomSheet } from '@suite-native/module-device-onboarding';
import { CloseActionType, useNavigateToInitialScreen } from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';
import { ReceiveAddressCard } from '../components/ReceiveAddressCard';
import { ReceiveScreenHeader } from '../components/ReceiveScreenHeader';
import { hasReceiveAddressButtonRequest } from '../hooks/receiveSelectors';
import { useAccountReceiveAddress } from '../hooks/useAccountReceiveAddress';

type ReceiveAddressScreenProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
};

export const ReceiveAddressScreen = ({
    accountKey,
    tokenContract,
    closeActionType,
}: ReceiveAddressScreenProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);

    const { triggerTransition, confirmOnTrezorRef } = useConfirmOnTrezorController();

    const hasReceiveButtonRequest = useSelector(hasReceiveAddressButtonRequest);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const navigation = useNavigation();

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    const handleShowReceiveAddress = useCallback(() => {
        handleShowAddress();

        if (isDeviceBackupRequired) {
            openModal();
        }
    }, [handleShowAddress, openModal, isDeviceBackupRequired]);

    const isConfirmOnTrezorReady =
        isUnverifiedAddressRevealed && !isReceiveApproved && hasReceiveButtonRequest;

    useEffect(() => {
        if (isConfirmOnTrezorReady) triggerTransition();
    }, [isConfirmOnTrezorReady, triggerTransition]);

    const closeNoBackupBottomSheet = useCallback(() => {
        closeModal();
    }, [closeModal]);

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) return <ReceiveBlockedDeviceCompromisedScreen />;

    const isAccountDetailVisible = !isUnverifiedAddressRevealed && !isReceiveApproved;

    if (G.isNullable(account) || G.isNullable(address)) {
        return <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />;
    }

    const onCancel = () => {
        TrezorConnect.cancel();
        navigation.goBack();
    };

    const showDestinationTagInfo =
        account.networkType === 'ripple' || account.networkType === 'stellar';

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType={isReceiveApproved ? 'close' : closeActionType}
            closeAction={isReceiveApproved ? navigateToInitialScreen : onCancel}
            defaultHeader={
                <ReceiveScreenHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={isReceiveApproved ? 'close' : closeActionType}
                />
            }
        >
            <VStack marginTop="sp8" spacing="sp16" flex={1}>
                {showDestinationTagInfo && (
                    <InlineAlertBox
                        variant="info"
                        title={
                            <Translation
                                id="moduleReceive.destinationTag"
                                values={{
                                    link: chunk => (
                                        <Link
                                            label={chunk}
                                            textVariant="label"
                                            href="https://trezor.io/learn/supported-assets/other-cryptocurrencies/destination-tags"
                                            isUnderlined
                                            textColor="textDefault"
                                            textPressedColor="textSubdued"
                                        />
                                    ),
                                    coinSymbol: getDisplaySymbol(account.symbol),
                                }}
                            />
                        }
                    />
                )}
                {isAccountDetailVisible && (
                    <AnimatedBox exiting={FadeOut}>
                        <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />
                    </AnimatedBox>
                )}
                <ReceiveAddressCard
                    symbol={account.symbol}
                    address={address}
                    isTokenAddress={!!tokenContract}
                    isReceiveApproved={isReceiveApproved}
                    isUnverifiedAddressRevealed={isUnverifiedAddressRevealed}
                    onShowAddress={handleShowReceiveAddress}
                />
            </VStack>
            {isDeviceBackupRequired && (
                <WalletBackupNotSetWarningBottomSheet
                    ref={bottomSheetRef}
                    onConfirm={closeNoBackupBottomSheet}
                    onClose={closeModal}
                />
            )}
        </ConfirmOnTrezorWrapper>
    );
};
