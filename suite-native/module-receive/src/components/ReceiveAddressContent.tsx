import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { type TransactionsRootState } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { AddressQRCodeActions } from '@suite-native/address';
import { ErrorMessage, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { type CloseActionType, Screen } from '@suite-native/navigation';

import { ReceiveAddressCard } from './ReceiveAddressCard';
import { ReceiveDestinationTagInfo } from './ReceiveDestinationTagInfo';
import { ReceiveScreenHeader } from './ReceiveScreenHeader';
import { ReceiveBlockedDeviceCompromisedScreen } from '../screens/ReceiveBlockedDeviceCompromisedScreen';

type ReceiveAddressContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
};

export const ReceiveAddressContent = ({
    accountKey,
    tokenContract,
    closeActionType,
}: ReceiveAddressContentProps) => {
    const freshAddress = useSelector((state: NativeAccountsRootState & TransactionsRootState) =>
        selectFreshAccountAddress(state, accountKey),
    );

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    if (G.isNullable(freshAddress)) {
        return <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />;
    }

    return (
        <Screen
            header={
                <ReceiveScreenHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <VStack paddingHorizontal="sp16" paddingTop="sp8" paddingBottom="sp16">
                        <AddressQRCodeActions address={freshAddress.address} />
                    </VStack>
                </>
            }
            noBottomPadding
        >
            <VStack marginTop="sp8" spacing="sp16" flex={1}>
                <ReceiveAddressCard
                    accountKey={accountKey}
                    address={freshAddress.address}
                    isTokenAddress={!!tokenContract}
                />
                <ReceiveDestinationTagInfo accountKey={accountKey} tokenContract={tokenContract} />
            </VStack>
        </Screen>
    );
};
