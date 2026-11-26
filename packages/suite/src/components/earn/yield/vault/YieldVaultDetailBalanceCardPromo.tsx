import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation, useTranslation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { toTokenSymbol } from '@suite-common/tokens';
import { Column, IconCircle, Row, Text } from '@trezor/components';
import { TrendUpIcon } from '@trezor/icons';

import { useYieldVaultDetail } from './useYieldVaultDetail';

export const YieldVaultDetailBalanceCardPromo = () => {
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { translationString } = useTranslation();

    const { underlyingToken, hasPositionInUnderlying, depositableBalance, potentialRewards } =
        useYieldVaultDetail();

    const rewardsCryptoTranslationId = hasPositionInUnderlying
        ? 'TR_EARN_YIELD_VAULT_DETAIL_EARN_MORE_CRYPTO'
        : 'TR_EARN_YIELD_VAULT_DETAIL_EARN_CRYPTO';

    const formattedDepositableBalance = CryptoAmountFormatter.format(depositableBalance, {
        symbol: toTokenSymbol(underlyingToken.symbol),
        isBalance: true,
        tokenDecimals: underlyingToken.decimals,
        formatStyle: 'compact-balance',
    });

    const formattedPotentialRewards = CryptoAmountFormatter.format(potentialRewards.crypto, {
        symbol: toTokenSymbol(underlyingToken.symbol),
        isBalance: true,
        withSymbol: true,
        formatStyle: 'compact-balance',
        tokenDecimals: underlyingToken.decimals,
    });

    const formattedPotentialRewardsWithBonus = potentialRewards.bonus.reduce(
        (rewards, { token: bonusToken, crypto }) =>
            crypto === null
                ? rewards
                : translationString('TR_EARN_YIELD_VAULT_DETAIL_REWARDS_WITH_BONUS', {
                      rewards,
                      bonusRewards: translationString(rewardsCryptoTranslationId, {
                          amount: CryptoAmountFormatter.format(crypto, {
                              symbol: bonusToken.symbol,
                              isBalance: true,
                              withSymbol: true,
                              formatStyle: 'compact-balance',
                              tokenDecimals: bonusToken.decimals,
                          }),
                      }),
                  }),
        formattedPotentialRewards,
    );

    const formattedPotientialRewardsInFiat = potentialRewards.fiat
        ? BaseCurrencyAmountFormatter.format(potentialRewards.fiat)
        : undefined;

    return (
        <Row padding={{ horizontal: 20, vertical: 12 }} gap={12} alignItems="center">
            <IconCircle icon={TrendUpIcon} intent="brand" size={24} />

            <Row flex="1" alignItems="center" justifyContent="space-between" gap={12}>
                <Column>
                    <Text typographyStyle="body-sm-strong">
                        <Translation
                            id={
                                hasPositionInUnderlying
                                    ? 'TR_EARN_YIELD_VAULT_DETAIL_EARN_MORE_TITLE'
                                    : 'TR_EARN_YIELD_VAULT_DETAIL_EARN_TITLE'
                            }
                        />
                    </Text>

                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <HiddenPlaceholder>
                            <Translation
                                id="TR_EARN_YIELD_VAULT_DETAIL_EARN_MORE_AVAILABLE"
                                values={{ amount: formattedDepositableBalance }}
                            />
                        </HiddenPlaceholder>
                    </Text>
                </Column>

                <Column alignItems="flex-end">
                    {formattedPotientialRewardsInFiat && (
                        <Text typographyStyle="body-sm-strong" intent="brand">
                            <HiddenPlaceholder>
                                <Translation
                                    id={
                                        hasPositionInUnderlying
                                            ? 'TR_EARN_YIELD_VAULT_DETAIL_EARN_MORE_A_YEAR'
                                            : 'TR_EARN_YIELD_VAULT_DETAIL_EARN_A_YEAR'
                                    }
                                    values={{ amount: formattedPotientialRewardsInFiat }}
                                />
                            </HiddenPlaceholder>
                        </Text>
                    )}

                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <HiddenPlaceholder>
                            <Translation
                                id={rewardsCryptoTranslationId}
                                values={{ amount: formattedPotentialRewardsWithBonus }}
                            />
                        </HiddenPlaceholder>
                    </Text>
                </Column>
            </Row>
        </Row>
    );
};
