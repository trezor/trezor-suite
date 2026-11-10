import { useSelector } from 'react-redux';

import { type TokenAddress } from '@suite-common/tokens';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    selectAccountNetworkType,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { TokenSymbol, type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { HELP_CENTER_OTHER_CRYPTOCURRENCIES_DESTINATION_TAGS_URL } from '@trezor/urls';

type ReceiveDestinationTagInfoProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveDestinationTagInfo = ({
    tokenContract,
    accountKey,
}: ReceiveDestinationTagInfoProps) => {
    // Tokens the account does not hold have no metadata here, so they fall back to the network symbol.
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
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
                        coinSymbol: token?.symbol ? (
                            // Nested Text does not inherit the banner title's typography.
                            <TokenSymbol
                                networkSymbol={accountSymbol}
                                contractAddress={token.contract}
                                variant="body-sm"
                                color="contentInfo"
                            />
                        ) : (
                            getNetworkDisplaySymbol(accountSymbol)
                        ),
                    }}
                />
            }
        />
    );
};
