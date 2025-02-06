import { useDispatch, useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import {
    AccountsRootState,
    removeButtonRequests,
    selectAccountByKey,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, ErrorMessage, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorImage,
    selectHasFirmwareAuthenticityCheckHardFailed,
} from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { CloseActionType, Screen } from '@suite-native/navigation';

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
    const dispatch = useDispatch();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);
    const hasReceiveButtonRequest = useSelector(hasReceiveAddressButtonRequest);

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );
    if (hasFirmwareAuthenticityCheckHardFailed) return <ReceiveBlockedDeviceCompromisedScreen />;

    const isAccountDetailVisible = !isUnverifiedAddressRevealed && !isReceiveApproved;

    if (G.isNullable(account) || G.isNullable(address)) {
        return <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />;
    }

    const handleShowAddressAndRemoveButtonRequests = async () => {
        await handleShowAddress();
        if (!device) return;
        dispatch(removeButtonRequests({ device }));
    };

    const isConfirmOnTrezorReady =
        isUnverifiedAddressRevealed && !isReceiveApproved && hasReceiveButtonRequest;

    return (
        <Screen
            header={
                <ReceiveScreenHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={isReceiveApproved ? 'close' : closeActionType}
                />
            }
            footer={
                isConfirmOnTrezorReady && (
                    <ConfirmOnTrezorImage
                        bottomSheetText={
                            <Translation id="moduleReceive.bottomSheets.confirmOnDeviceMessage" />
                        }
                    />
                )
            }
        >
            <Box flex={1}>
                <VStack marginTop="sp8" spacing="sp16">
                    {isAccountDetailVisible && (
                        <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />
                    )}
                    <ReceiveAddressCard
                        symbol={account.symbol}
                        address={address}
                        isTokenAddress={!!tokenContract}
                        isReceiveApproved={isReceiveApproved}
                        isUnverifiedAddressRevealed={isUnverifiedAddressRevealed}
                        onShowAddress={handleShowAddressAndRemoveButtonRequests}
                    />
                </VStack>
            </Box>
        </Screen>
    );
};
