import { useDispatch, useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { ErrorMessage, VStack, Box } from '@suite-native/atoms';
import {
    AccountsRootState,
    removeButtonRequests,
    selectAccountByKey,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { ConfirmOnTrezorImage } from '@suite-native/device';
import { Screen } from '@suite-native/navigation';

import { useAccountReceiveAddress } from '../hooks/useAccountReceiveAddress';
import { ReceiveAddressCard } from '../components/ReceiveAddressCard';
import { ReceiveAccountDetailsCard } from '../components/ReceiveAccountDetailsCard';
import { hasReceiveAddressButtonRequest } from '../hooks/receiveSelectors';
import { ReceiveScreenHeader } from '../components/ReceiveScreenHeader';

type AccountReceiveProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveAccountScreen = ({ accountKey, tokenContract }: AccountReceiveProps) => {
    const dispatch = useDispatch();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);
    const hasReceiveButtonRequest = useSelector(hasReceiveAddressButtonRequest);

    const { address, isReceiveApproved, isUnverifiedAddressRevealed, handleShowAddress } =
        useAccountReceiveAddress(accountKey);

    const isAccountDetailVisible = !isUnverifiedAddressRevealed && !isReceiveApproved;

    if (G.isNullable(account) || G.isNullable(address))
        return <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />;

    const handleShowAddressAndRemoveButtonRequests = async () => {
        await handleShowAddress();
        if (!device) return;
        dispatch(removeButtonRequests({ device }));
    };

    const isConfirmOnTrezorReady =
        isUnverifiedAddressRevealed && !isReceiveApproved && hasReceiveButtonRequest;

    return (
        <Screen
            header={<ReceiveScreenHeader accountKey={accountKey} tokenContract={tokenContract} />}
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
                        <ReceiveAccountDetailsCard
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                        />
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
