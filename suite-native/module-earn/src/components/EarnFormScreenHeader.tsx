import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

type EarnFormScreenHeaderProps = {
    accountKey: AccountKey;
};

export const EarnFormScreenHeader = ({ accountKey }: EarnFormScreenHeaderProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) {
        return;
    }

    const assetName = getNetworkDisplaySymbolName(account.symbol);

    return (
        <ScreenHeader
            customContent={
                <Text variant="body-md-strong">
                    <Translation id="earn.earnFormScreen.title" values={{ assetName }} />
                </Text>
            }
        />
    );
};
