import { Row, Column, Icon, Divider } from '@trezor/components';
import { EnhancedTokenInfo } from '@suite-common/token-definitions';
import { isTestnet } from '@suite-common/wallet-utils';
import { TokenIconSet } from '@trezor/product-components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';
import { CoinBalance, FiatValue, HiddenPlaceholder, Translation } from 'src/components/suite';
import { Text } from '@trezor/components';
type AssetCardTokensAndStakingInfoProps = {
    symbol: NetworkSymbol;
    tokens: EnhancedTokenInfo[];
    tokensFiatBalance: string;
    assetStakingBalance: string;
    shouldRenderStaking: boolean;
    shouldRenderTokens: boolean;
};

export const AssetCardTokensAndStakingInfo = ({
    symbol,
    tokens,
    tokensFiatBalance,
    assetStakingBalance,
    shouldRenderStaking,
    shouldRenderTokens,
}: AssetCardTokensAndStakingInfoProps) => {
    return (
        <Column alignItems="stretch">
            <Divider strokeWidth={1} margin={{ top: spacings.xs, bottom: spacings.xs }} />
            {shouldRenderStaking && (
                <Row
                    justifyContent="space-between"
                    margin={{ left: spacings.xs, right: spacings.xs, bottom: spacings.xs }}
                >
                    <Row gap={spacings.xs}>
                        <Icon name="piggyBankFilled" variant="tertiary" />

                        <Text typographyStyle="body" variant="tertiary">
                            <Translation id="TR_NAV_STAKING" />
                        </Text>
                    </Row>
                    {assetStakingBalance && !isTestnet(symbol) ? (
                        <>
                            <HiddenPlaceholder>
                                <Text typographyStyle="hint" variant="tertiary">
                                    <CoinBalance value={assetStakingBalance} symbol={symbol} />
                                </Text>
                            </HiddenPlaceholder>
                            <HiddenPlaceholder>
                                <FiatValue amount={assetStakingBalance} symbol={symbol} />
                            </HiddenPlaceholder>
                        </>
                    ) : (
                        <CoinBalance value={assetStakingBalance} symbol={symbol} />
                    )}
                </Row>
            )}
            {shouldRenderTokens && (
                <Row
                    justifyContent="space-between"
                    margin={{ left: spacings.xs, right: spacings.xs, bottom: spacings.xs }}
                >
                    <Row gap={spacings.xs}>
                        <TokenIconSet tokens={tokens} network={symbol} />
                        <Text typographyStyle="body" variant="tertiary">
                            <Translation id="TR_NAV_TOKENS" />
                        </Text>
                    </Row>
                    <FiatValue
                        amount={tokensFiatBalance ?? '0'}
                        symbol={symbol}
                        shouldConvert={false}
                    />
                </Row>
            )}
        </Column>
    );
};
