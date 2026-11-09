import { type ReactNode } from 'react';

import { type AccountKey } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { AccountLabel } from '@suite-native/accounts';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

type ReceiveAddressListHeaderProps = {
    accountKey: AccountKey;
    rightIcon?: ReactNode;
};

export const ReceiveAddressListHeader = ({
    accountKey,
    rightIcon,
}: ReceiveAddressListHeaderProps) => {
    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    return (
        <ScreenHeader
            closeActionType="back"
            rightIcon={rightIcon}
            customContent={
                <>
                    <Text variant="body-md-strong">
                        <Translation id="moduleReceive.addressList.title" />
                    </Text>
                    <HStack spacing="sp8" alignItems="center">
                        <Text variant="body-md-strong">
                            <AccountLabel
                                accountDescriptor={accountDescriptor}
                                networkSymbol={networkSymbol}
                                deviceStaticSessionId={deviceStaticSessionId}
                            />
                        </Text>
                    </HStack>
                </>
            }
        />
    );
};
