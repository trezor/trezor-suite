import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Divider, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import {
    BaseCurrencyValue,
    CoinBalance,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';

type AssetCardTokensAndStakingInfoProps = {
    symbol: NetworkSymbol;
    tokensFiatBalance: string;
    assetStakingBalance: string;
    shouldRenderStaking: boolean;
    shouldRenderTokens: boolean;
};

export const AssetCardTokensAndStakingInfo = ({
    symbol,
    tokensFiatBalance,
    assetStakingBalance,
    shouldRenderStaking,
    shouldRenderTokens,
}: AssetCardTokensAndStakingInfoProps) => (
    <Column>
        <Divider strokeWidth={1} margin={{ vertical: spacings.xs }} />
        {shouldRenderStaking && (
            <Row
                justifyContent="space-between"
                margin={{ horizontal: spacings.xs, bottom: spacings.xs }}
            >
                <Row gap={spacings.xs}>
                    <Icon name="piggyBankFilled" variant="tertiary" />
                    <Text typographyStyle="body" variant="tertiary">
                        <Translation id="TR_NAV_STAKING" />
                    </Text>
                </Row>
                {assetStakingBalance && (
                    <>
                        <HiddenPlaceholder>
                            <Text typographyStyle="hint" variant="tertiary">
                                <CoinBalance value={assetStakingBalance} symbol={symbol} />
                            </Text>
                        </HiddenPlaceholder>
                        <HiddenPlaceholder>
                            <BaseCurrencyValue amount={assetStakingBalance} symbol={symbol} />
                        </HiddenPlaceholder>
                    </>
                )}
            </Row>
        )}
        {shouldRenderTokens && (
            <Row
                justifyContent="space-between"
                margin={{ horizontal: spacings.xs, bottom: spacings.xs }}
            >
                <Row gap={spacings.xs}>
                    <TokenIconSetWrapper symbol={symbol} />
                    <Text typographyStyle="body" variant="tertiary">
                        <Translation id="TR_NAV_TOKENS" />
                    </Text>
                </Row>
                <BaseCurrencyValue
                    amount={tokensFiatBalance ?? '0'}
                    symbol={symbol}
                    shouldConvert={false}
                />
            </Row>
        )}
    </Column>
);
