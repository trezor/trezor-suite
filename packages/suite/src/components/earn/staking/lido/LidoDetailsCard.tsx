import { type ReactNode } from 'react';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Card, Divider, type Padding, Row, Text, Tooltip } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useFormatApy } from '#src/hooks/earn/useFormatApy';

import { useLidoStaking } from './useLidoStaking';

const ETH_DECIMALS = 18;

const LIDO_PROVIDER_NAME = 'Lido';

const ROW_PADDING = { vertical: 12, horizontal: 20 } satisfies Padding;
const ROW_MIN_HEIGHT = 56;

type LidoDetailsRowProps = {
    label: ReactNode;
    tooltip?: ReactNode;
    children: ReactNode;
    'data-testid'?: string;
};

const LidoDetailsRow = ({
    label,
    tooltip,
    children,
    'data-testid': dataTestId,
}: LidoDetailsRowProps) => (
    <Row
        justifyContent="space-between"
        alignItems="center"
        gap={16}
        padding={ROW_PADDING}
        minHeight={ROW_MIN_HEIGHT}
        data-testid={dataTestId}
    >
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            {tooltip === undefined ? (
                label
            ) : (
                <Tooltip content={tooltip} hasIcon>
                    {label}
                </Tooltip>
            )}
        </Text>

        <Text typographyStyle="body-sm" align="end">
            {children}
        </Text>
    </Row>
);

type LidoDetailsCardProps = {
    account: Account;
};

/** What the stake is: its rate, what the wstETH represents in ETH, the provider and the product. */
export const LidoDetailsCard = ({ account }: LidoDetailsCardProps) => {
    const formatApy = useFormatApy();
    const { position, wstETHToken, rate } = useLidoStaking(account);

    const representedAmount =
        position === null
            ? null
            : new BigNumber(position.balances.staked).shiftedBy(-ETH_DECIMALS).toFixed();
    const displaySymbol = <AssetSymbol networkSymbol={account.symbol} />;
    const divider = <Divider margin={{}} color="elementBorderNeutralSofter" />;

    return (
        <Card paddingType="none" data-testid="@staking/lido-details-card/container">
            <LidoDetailsRow
                label={<Translation id="TR_EARN_LIDO_CARD_RATE" />}
                tooltip={<Translation id="TR_EARN_LIDO_RATE_TOOLTIP" />}
                data-testid="@staking/lido-details-card/rate"
            >
                {formatApy(rate, { withSymbol: true })}
            </LidoDetailsRow>

            {divider}

            <LidoDetailsRow
                label={<Translation id="TR_EARN_LIDO_DETAIL_REWARD_ACCRUAL" />}
                tooltip={<Translation id="TR_EARN_LIDO_DETAIL_REWARD_ACCRUAL_TOOLTIP" />}
            >
                <Translation id="TR_EARN_LIDO_DETAIL_REWARD_ACCRUAL_VALUE" />
            </LidoDetailsRow>

            {representedAmount !== null && (
                <>
                    {divider}

                    <LidoDetailsRow
                        label={<Translation id="TR_EARN_LIDO_DETAIL_REPRESENTS" />}
                        tooltip={
                            <Translation
                                id="TR_EARN_LIDO_REPRESENTS_TOOLTIP"
                                values={{ displaySymbol }}
                            />
                        }
                        data-testid="@staking/lido-details-card/represents"
                    >
                        <Row gap={8} alignItems="center">
                            <TokenIcon
                                size={20}
                                networkSymbol={account.symbol}
                                isBordered={false}
                            />
                            <FormattedCryptoAmount
                                value={representedAmount}
                                networkSymbol={account.symbol}
                                isCompact
                            />
                        </Row>
                    </LidoDetailsRow>
                </>
            )}

            {divider}

            <LidoDetailsRow label={<Translation id="TR_EARN_LIDO_DETAIL_PROVIDER" />}>
                <Row gap={8} alignItems="center">
                    {wstETHToken !== null && (
                        <TokenIcon
                            size={20}
                            networkSymbol={account.symbol}
                            contractAddress={wstETHToken.contractAddress ?? null}
                            placeholder={wstETHToken.symbol}
                            isBordered={false}
                        />
                    )}
                    {LIDO_PROVIDER_NAME}
                </Row>
            </LidoDetailsRow>

            {divider}

            <LidoDetailsRow label={<Translation id="TR_EARN_LIDO_DETAIL_PRODUCT" />}>
                <Translation id="TR_EARN_LIDO_DETAIL_PRODUCT_VALUE" />
            </LidoDetailsRow>
        </Card>
    );
};
