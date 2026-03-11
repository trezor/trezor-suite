import { useCallback, useEffect } from 'react';
import { FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { selectIsDeviceBackupRequired } from '@suite-common/device';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
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
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { useInAppRating } from '@suite-native/in-app-rating';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { WalletBackupNotSetWarningBottomSheet } from '@suite-native/module-device-onboarding';
import { CloseActionType } from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import TrezorConnect from '@trezor/connect';
import { HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL } from '@trezor/urls';

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
    const { askForRating } = useInAppRating();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);

    const { revealConfirmOnTrezorSheet, confirmOnTrezorRef, closeSheet } =
        useConfirmOnTrezorController();

    const hasReceiveButtonRequest = useSelector(hasReceiveAddressButtonRequest);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const navigation = useNavigation();

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    usePreventRemove(true, ({ data }) => {
        TrezorConnect.cancel();
        navigation.dispatch(data.action);
        if (isReceiveApproved) {
            askForRating();
        }
    });

    const handleShowReceiveAddress = useCallback(() => {
        handleShowAddress();

        if (isDeviceBackupRequired) {
            openModal();
        }
    }, [handleShowAddress, openModal, isDeviceBackupRequired]);

    const isLoading =
        !(isReceiveApproved || hasReceiveButtonRequest) && isUnverifiedAddressRevealed;
    const isConfirmOnTrezorReady =
        isUnverifiedAddressRevealed && !isReceiveApproved && hasReceiveButtonRequest;

    useEffect(() => {
        if (isConfirmOnTrezorReady) revealConfirmOnTrezorSheet();
    }, [isConfirmOnTrezorReady, revealConfirmOnTrezorSheet]);

    useEffect(() => {
        if (isReceiveApproved) closeSheet();
    }, [isReceiveApproved, closeSheet]);

    const closeNoBackupBottomSheet = useCallback(() => {
        closeModal();
    }, [closeModal]);

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
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
            closeActionType={closeActionType}
            closeAction={onCancel}
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
                                            textVariant="body-xs"
                                            href={
                                                HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL
                                            }
                                            isUnderlined
                                            textColor="textDefault"
                                            textPressedColor="textSubdued"
                                        />
                                    ),
                                    coinSymbol: tokenSymbol ?? getDisplaySymbol(account.symbol),
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
                    accountDescriptor={account.descriptor}
                    symbol={account.symbol}
                    address={address}
                    isLoading={isLoading}
                    deviceStaticSessionId={account.deviceState}
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
