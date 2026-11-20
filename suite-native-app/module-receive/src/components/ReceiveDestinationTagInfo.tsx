import { useSelector } from 'react-redux';

import { type TokenAddress } from '@suite-common/tokens';
import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    selectAccountNetworkType,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
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
                        coinSymbol: (
                            // Nested Text does not inherit the banner title's typography.
                            <AssetSymbol
                                networkSymbol={accountSymbol}
                                contractAddress={token?.symbol ? token.contract : undefined}
                                variant="body-sm"
                                color="contentInfo"
                            />
                        ),
                    }}
                />
            }
        />
    );
};
