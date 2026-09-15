import { type NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { AddressLabel } from '@suite-native/address';
import { HStack, Text } from '@suite-native/atoms';
import { AddressFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type AccountAddress, type StaticSessionId } from '@trezor/connect';
import { getAddressPathIndex } from '@trezor/crypto-utils';

type ReceiveAddressListItemProps = {
    address: AccountAddress;
    symbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
};

export const ReceiveAddressListItem = ({
    address,
    symbol,
    deviceStaticSessionId,
}: ReceiveAddressListItemProps) => {
    const addressIndex = getAddressPathIndex(address.path);
    const isUsed = !!address.transfers;

    return (
        <HStack justifyContent="space-between" alignItems="center" spacing="sp12">
            <HStack spacing="sp8" alignItems="center" flex={1}>
                {addressIndex !== undefined && (
                    <Text variant="body-md" color="contentSecondary">
                        {addressIndex}
                    </Text>
                )}
                <AddressLabel
                    address={address.address}
                    deviceStaticSessionId={deviceStaticSessionId}
                    variant="body-md"
                    color="contentPrimary"
                    fallback={
                        <AddressFormatter
                            value={address.address}
                            format="short"
                            variant="body-md"
                            color="contentPrimary"
                        />
                    }
                />
            </HStack>
            <HStack spacing="sp12" alignItems="center">
                {isUsed ? (
                    <CryptoAmountFormatter
                        value={formatNetworkAmount(address.received ?? '0', symbol)}
                        symbol={symbol}
                        variant="body-md"
                        color="contentPrimary"
                    />
                ) : (
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="moduleReceive.addressList.unused" />
                    </Text>
                )}
                <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
            </HStack>
        </HStack>
    );
};
