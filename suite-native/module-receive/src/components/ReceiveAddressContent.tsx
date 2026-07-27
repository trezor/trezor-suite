import { useSelector } from 'react-redux';

import { type TransactionsRootState } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type NativeAccountsRootState,
    selectFreshAccountAddressValue,
} from '@suite-native/accounts';
import { ErrorMessage, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { type CloseActionType, Screen } from '@suite-native/navigation';

import { ReceiveAddressActions } from './ReceiveAddressActions';
import { ReceiveAddressCard } from './ReceiveAddressCard';
import { ReceiveDestinationTagInfo } from './ReceiveDestinationTagInfo';
import { ReceiveScreenHeader } from './ReceiveScreenHeader';
import { useReceiveAddressVerification } from '../hooks/useReceiveAddressVerification';
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
    const address = useSelector((state: NativeAccountsRootState & TransactionsRootState) =>
        selectFreshAccountAddressValue(state, accountKey),
    );
    const { verifyAddressOnDevice } = useReceiveAddressVerification(accountKey);

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    if (!address) {
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
                        <ReceiveAddressActions
                            address={address}
                            onVerifyAddress={verifyAddressOnDevice}
                        />
                    </VStack>
                </>
            }
            noBottomPadding
        >
            <VStack marginTop="sp8" spacing="sp16" flex={1}>
                <ReceiveAddressCard
                    accountKey={accountKey}
                    address={address}
                    tokenContract={tokenContract}
                />
                <ReceiveDestinationTagInfo accountKey={accountKey} tokenContract={tokenContract} />
            </VStack>
        </Screen>
    );
};
