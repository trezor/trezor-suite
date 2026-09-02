import { type NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { HStack, Text } from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { type AccountAddress } from '@trezor/connect';

type ReceiveAddressDetailHeaderProps = {
    address: AccountAddress;
    symbol: NetworkSymbol;
};

export const ReceiveAddressDetailHeader = ({
    address,
    symbol,
}: ReceiveAddressDetailHeaderProps) => {
    const isUsed = address.transfers > 0;

    return (
        <ScreenHeader
            closeActionType="back"
            customContent={
                <>
                    <Text variant="body-md-strong">
                        <Translation id="moduleReceive.addressDetail.title" />
                    </Text>
                    {isUsed ? (
                        <HStack spacing="sp4" alignItems="center">
                            <ExactCryptoAmountFormatter
                                value={formatNetworkAmount(address.received ?? '0', symbol)}
                                symbol={symbol}
                                variant="body-sm"
                                color="contentSecondary"
                            />
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation id="moduleReceive.addressDetail.received" />
                            </Text>
                        </HStack>
                    ) : (
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleReceive.addressDetail.unused" />
                        </Text>
                    )}
                </>
            }
        />
    );
};
