import { useSelector } from 'react-redux';

import type { TokenAddress } from '@suite-common/tokens';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    selectAccountNetworkType,
} from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { TokenSymbol } from '@suite-native/tokens';
import { HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL } from '@trezor/urls';

type ReceiveDestinationTagInfoProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveDestinationTagInfo = ({
    tokenContract,
    accountKey,
}: ReceiveDestinationTagInfoProps) => {
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
        <BannerInline
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
                        coinSymbol: (
                            <TokenSymbol
                                isInline
                                networkSymbol={accountSymbol}
                                tokenContract={tokenContract}
                                variant="body-xs"
                            />
                        ),
                    }}
                />
            }
        />
    );
};
