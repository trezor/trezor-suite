import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Divider, Icon, Row, Text } from '@trezor/components';

import { BaseCurrencyValue, CoinBalance, HiddenPlaceholder } from 'src/components/suite';
import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';

type AssetCardTokensAndStakingInfoProps = {
    symbol: NetworkSymbol;
    tokensFiatBalance: string;
    assetStakingBalance: string;
    shouldRenderStaking: boolean;
    shouldRenderTokens: boolean;
    accounts: Account[];
};

export const AssetCardTokensAndStakingInfo = ({
    symbol,
    tokensFiatBalance,
    assetStakingBalance,
    shouldRenderStaking,
    shouldRenderTokens,
    accounts,
}: AssetCardTokensAndStakingInfoProps) => (
    <Column gap={10}>
        <Divider strokeWidth={1} margin={0} />
        {shouldRenderStaking && (
            <Row justifyContent="space-between" margin={{ horizontal: 8 }}>
                <Row gap={8}>
                    <Icon name="piggyBankFilled" size={20} intent="neutral" priority="secondary" />
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_NAV_STAKING" />
                    </Text>
                </Row>
                {assetStakingBalance && (
                    <>
                        <HiddenPlaceholder>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <CoinBalance value={assetStakingBalance} symbol={symbol} />
                            </Text>
                        </HiddenPlaceholder>
                        <HiddenPlaceholder>
                            <Text typographyStyle="body-sm">
                                <BaseCurrencyValue amount={assetStakingBalance} symbol={symbol} />
                            </Text>
                        </HiddenPlaceholder>
                    </>
                )}
            </Row>
        )}
        {shouldRenderTokens && (
            <Row justifyContent="space-between" margin={{ horizontal: 8 }}>
                <Row gap={8}>
                    <TokenIconSetWrapper accounts={accounts} symbol={symbol} />
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_NAV_TOKENS" />
                    </Text>
                </Row>
                <Text typographyStyle="body-sm">
                    <BaseCurrencyValue
                        amount={tokensFiatBalance ?? '0'}
                        symbol={symbol}
                        shouldConvert={false}
                    />
                </Text>
            </Row>
        )}
    </Column>
);
