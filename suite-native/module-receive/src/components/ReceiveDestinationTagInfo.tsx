import { useSelector } from 'react-redux';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    selectAccountNetworkType,
} from '@suite-common/wallet-core';
import type { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import { HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL } from '@trezor/urls';

type ReceiveDestinationTagInfoProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveDestinationTagInfo = ({
    tokenContract,
    accountKey,
}: ReceiveDestinationTagInfoProps) => {
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const accountNetworkType = useSelector((state: AccountsRootState) =>
        selectAccountNetworkType(state, accountKey),
    );

    const showDestinationTagInfo =
        accountNetworkType === 'ripple' || accountNetworkType === 'stellar';

    if (!accountSymbol || !showDestinationTagInfo) {
        return null;
    }

    return (
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
                                href={HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL}
                                isUnderlined
                                textColor="contentPrimary"
                                textPressedColor="contentSecondary"
                            />
                        ),
                        coinSymbol: tokenSymbol ?? getDisplaySymbol(accountSymbol),
                    }}
                />
            }
        />
    );
};
