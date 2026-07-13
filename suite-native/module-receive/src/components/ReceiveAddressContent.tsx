import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { ErrorMessage, InlineAlertBox, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { type CloseActionType, Screen } from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import { HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL } from '@trezor/urls';

import { ReceiveAddressCard } from './ReceiveAddressCard';
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
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const freshAddress = useSelector((state: NativeAccountsRootState & TransactionsRootState) =>
        selectFreshAccountAddress(state, accountKey),
    );
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    if (G.isNullable(account) || G.isNullable(freshAddress)) {
        return <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />;
    }

    const showDestinationTagInfo =
        account.networkType === 'ripple' || account.networkType === 'stellar';

    return (
        <Screen
            header={
                <ReceiveScreenHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            }
        >
            <VStack marginTop="sp8" spacing="sp16" flex={1}>
                {showDestinationTagInfo && (
                    <InlineAlertBox
                        intent="info"
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
                                            textColor="contentPrimary"
                                            textPressedColor="contentSecondary"
                                        />
                                    ),
                                    coinSymbol: tokenSymbol ?? getDisplaySymbol(account.symbol),
                                }}
                            />
                        }
                    />
                )}
                <ReceiveAddressCard
                    accountDescriptor={account.descriptor}
                    symbol={account.symbol}
                    address={freshAddress.address}
                    deviceStaticSessionId={account.deviceState}
                    isTokenAddress={!!tokenContract}
                />
            </VStack>
        </Screen>
    );
};
