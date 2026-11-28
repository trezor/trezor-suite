import { Translation } from '@suite/intl';
import { selectStakingProductDescriptor } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import {
    Button,
    Card,
    Column,
    Divider,
    IconCircle,
    type Padding,
    Row,
    Text,
} from '@trezor/components';
import { PlusIcon, TrendUpIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useLidoStaking } from './useLidoStaking';
import { useNavigateToLidoRoute } from './useNavigateToLidoRoute';

const ETH_DECIMALS = 18;

const FOOTER_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;

type LidoStakedCardProps = {
    account: Account;
};

/** The stake in fiat with the wstETH that holds it, and the two ways to change it. */
export const LidoStakedCard = ({ account }: LidoStakedCardProps) => {
    const navigateToLidoRoute = useNavigateToLidoRoute(account);
    const { productId, position, wstETHToken, wstETHBalance, rate } = useLidoStaking(account);
    const limits = useSelector(state => selectStakingProductDescriptor(state, productId)?.limits);

    const stakedAmount = new BigNumber(position?.balances.staked ?? 0)
        .shiftedBy(-ETH_DECIMALS)
        .toFixed();
    const hasStake = new BigNumber(wstETHBalance).gt(0);
    const tokenAmount = new BigNumber(wstETHBalance)
        .shiftedBy(-(wstETHToken?.decimals ?? ETH_DECIMALS))
        .toFixed();
    // Without the wstETH value the stake cannot be priced, so the card leads with the tokens.
    const isStakeValueKnown = position !== null || !hasStake;

    // The balance left to stake, the fee buffer kept aside, and what it would earn in a year.
    const stakeableBalance = BigNumber.max(
        new BigNumber(account.availableBalance).minus(limits?.feeBufferBalance ?? 0),
        0,
    ).shiftedBy(-ETH_DECIMALS);
    const yearlyRewardsOfBalance = rate === null ? null : stakeableBalance.times(rate).div(100);
    const yearlyRewardsAmount = yearlyRewardsOfBalance?.gt(0)
        ? yearlyRewardsOfBalance.toFixed()
        : null;

    return (
        <Card paddingType="none" data-testid="@staking/lido-staked-card/container">
            <Column
                gap={16}
                alignItems="stretch"
                padding={{
                    top: 20,
                    horizontal: 20,
                    bottom: yearlyRewardsAmount === null ? 20 : 16,
                }}
            >
                <Column gap={8} alignItems="flex-start">
                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_LIDO_CARD_STAKED" />
                    </Text>

                    <Text
                        typographyStyle="headline-md"
                        data-testid="@staking/lido-staked-card/staked-amount"
                    >
                        {isStakeValueKnown || wstETHToken === null ? (
                            <BaseCurrencyValue amount={stakedAmount} symbol={account.symbol} />
                        ) : (
                            <FormattedCryptoAmount
                                value={tokenAmount}
                                networkSymbol={wstETHToken.symbol}
                                isCompact
                            />
                        )}
                    </Text>

                    {isStakeValueKnown && wstETHToken !== null && (
                        <Row gap={6} alignItems="center">
                            <TokenIcon
                                size={20}
                                networkSymbol={account.symbol}
                                contractAddress={wstETHToken.contractAddress ?? null}
                                placeholder={wstETHToken.symbol}
                                isBordered={false}
                            />
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                data-testid="@staking/lido-staked-card/token-amount"
                            >
                                <FormattedCryptoAmount
                                    value={tokenAmount}
                                    networkSymbol={wstETHToken.symbol}
                                    isCompact
                                />
                            </Text>
                        </Row>
                    )}
                </Column>

                <Row gap={8}>
                    <Button
                        size="large"
                        flex="1"
                        intent="brand"
                        priority="primary"
                        iconLeft={PlusIcon}
                        onClick={() => navigateToLidoRoute('earn-lido-stake')}
                        data-testid="@staking/lido-staked-card/stake-button"
                    >
                        <Translation
                            id={
                                hasStake
                                    ? 'TR_EARN_STAKING_DASHBOARD_STAKE_MORE'
                                    : 'TR_EARN_STAKING_DASHBOARD_STAKE_NOW'
                            }
                        />
                    </Button>

                    {hasStake && (
                        <Button
                            size="large"
                            flex="1"
                            intent="brand"
                            priority="secondary"
                            onClick={() => navigateToLidoRoute('earn-lido-unstake')}
                            data-testid="@staking/lido-staked-card/unstake-button"
                        >
                            <Translation id="TR_STAKE_UNSTAKE" />
                        </Button>
                    )}
                </Row>
            </Column>

            {yearlyRewardsAmount !== null && (
                <>
                    <Divider margin={{}} color="elementBorderNeutralSofter" />

                    <Row
                        gap={12}
                        alignItems="center"
                        padding={FOOTER_PADDING}
                        data-testid="@staking/lido-staked-card/earn-more"
                    >
                        <IconCircle icon={TrendUpIcon} intent="brand" size={24} />

                        <Column gap={2} alignItems="flex-start">
                            <Text typographyStyle="body-sm-strong">
                                <Translation id="TR_EARN_LIDO_EARN_MORE_TITLE" />
                            </Text>
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                <Translation
                                    id="TR_EARN_LIDO_EARN_MORE_AVAILABLE"
                                    values={{
                                        amount: (
                                            <FormattedCryptoAmount
                                                value={stakeableBalance.toFixed()}
                                                networkSymbol={account.symbol}
                                                isCompact
                                            />
                                        ),
                                    }}
                                />
                            </Text>
                        </Column>

                        <Column gap={2} alignItems="flex-end" flex="1">
                            <Text typographyStyle="body-sm-strong" intent="brand" align="end">
                                <Translation
                                    id="TR_EARN_LIDO_EARN_MORE_YEARLY"
                                    values={{
                                        amount: (
                                            <BaseCurrencyValue
                                                amount={yearlyRewardsAmount}
                                                symbol={account.symbol}
                                            />
                                        ),
                                    }}
                                />
                            </Text>
                            <Text
                                typographyStyle="body-xs"
                                intent="neutral"
                                priority="secondary"
                                align="end"
                            >
                                <FormattedCryptoAmount
                                    value={yearlyRewardsAmount}
                                    networkSymbol={account.symbol}
                                    isCompact
                                />
                            </Text>
                        </Column>
                    </Row>
                </>
            )}
        </Card>
    );
};
