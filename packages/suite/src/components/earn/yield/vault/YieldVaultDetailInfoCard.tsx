import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation, useTranslation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { toTokenSymbol } from '@suite-common/tokens';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { useYieldVaultDetail } from './useYieldVaultDetail';
import { EarnInfoCard } from '../../common/EarnInfoCard';
import { EarnYieldApyTooltip } from '../../dashboard/yield/EarnYieldApyTooltip';
import { EarnProviderLogo } from '../../providers/EarnProviderLogo';
import { isEarnProviderId } from '../../providers/providerMetadata';

export const YieldVaultDetailInfoCard = () => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { translationString } = useTranslation();

    const {
        account,
        vault,
        underlyingToken,
        apy,
        yearlyRewards,
        positionInUnderlying,
        hasPositionInUnderlying,
    } = useYieldVaultDetail();

    const formattedYearlyRewards = CryptoAmountFormatter.format(yearlyRewards.crypto, {
        symbol: toTokenSymbol(underlyingToken.symbol),
        isBalance: true,
        withSymbol: true,
        formatStyle: 'compact-balance',
        tokenDecimals: underlyingToken.decimals,
    });

    const formattedYearlyRewardsWithBonus = yearlyRewards.bonus.reduce(
        (rewards, { token: bonusToken, crypto }) =>
            crypto === null
                ? rewards
                : translationString('TR_EARN_YIELD_VAULT_DETAIL_REWARDS_WITH_BONUS', {
                      rewards,
                      bonusRewards: CryptoAmountFormatter.format(crypto, {
                          symbol: bonusToken.symbol,
                          isBalance: true,
                          withSymbol: true,
                          formatStyle: 'compact-balance',
                          tokenDecimals: bonusToken.decimals,
                      }),
                  }),
        formattedYearlyRewards,
    );

    return (
        <EarnInfoCard
            rows={[
                {
                    key: 'apy',
                    label: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_APY" />,
                    value: (
                        <EarnYieldApyTooltip
                            vault={vault}
                            apyPercentage={apy}
                            networkSymbol={account.symbol}
                            typographyStyle="body-sm"
                        />
                    ),
                },
                {
                    key: 'estimated-yearly-rewards',
                    isHidden: !hasPositionInUnderlying,
                    label: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_ESIMATED_YEARLY_REWARDS" />,
                    value: (
                        <>
                            {apy === null ? (
                                <Text typographyStyle="body-sm">
                                    <Translation id="TR_EARN_N_A" />
                                </Text>
                            ) : (
                                <Column alignItems="flex-end" gap={0}>
                                    {yearlyRewards.fiat !== null && (
                                        <HiddenPlaceholder>
                                            <Text typographyStyle="body-sm-strong">
                                                <BaseCurrencyAmountFormatter
                                                    currency={baseCurrency.toUpperCase()}
                                                    value={yearlyRewards.fiat}
                                                />
                                            </Text>
                                        </HiddenPlaceholder>
                                    )}

                                    <HiddenPlaceholder>
                                        <Text
                                            typographyStyle="body-xs"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            {formattedYearlyRewardsWithBonus}
                                        </Text>
                                    </HiddenPlaceholder>
                                </Column>
                            )}
                        </>
                    ),
                },
                {
                    key: 'reward-payout',
                    label: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_REWARD_PAYOUT" />,
                    value: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_EVERY_BLOCK" />,
                },
                {
                    key: 'represents',
                    isHidden: !hasPositionInUnderlying,
                    label: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_REPRESENTS" />,
                    value: (
                        <Row alignItems="center" gap={6}>
                            <TokenIcon
                                networkSymbol={account.symbol}
                                contractAddress={underlyingToken.vaultToken.address}
                                size={20}
                                isBordered={false}
                                isTransparent={true}
                                wrappedTokenIcon="network"
                            />

                            <HiddenPlaceholder>
                                <Text typographyStyle="body-sm" intent="neutral">
                                    <CryptoAmountFormatter
                                        value={positionInUnderlying}
                                        symbol={toTokenSymbol(underlyingToken.symbol)}
                                        isBalance
                                        tokenDecimals={underlyingToken.decimals}
                                        formatStyle="compact-balance"
                                    />
                                </Text>
                            </HiddenPlaceholder>
                        </Row>
                    ),
                },
                {
                    key: 'provider',
                    label: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_PROVIDER" />,
                    value: (
                        <>
                            {isEarnProviderId(vault.providerId) ? (
                                <EarnProviderLogo provider={vault.providerId} height={16} />
                            ) : (
                                <Text typographyStyle="body-sm">{vault.providerId}</Text>
                            )}
                        </>
                    ),
                },
                {
                    key: 'vault',
                    label: <Translation id="TR_EARN_YIELD_VAULT_DETAIL_VAULT" />,
                    value: vault.outputToken?.name ?? '',
                },
            ]}
        />
    );
};
