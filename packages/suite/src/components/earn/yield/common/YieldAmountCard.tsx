import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Translation } from '@suite/intl';
import type { TranslationKey } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { Card, Column, Row, Text, TextButton } from '@trezor/components';
import { AssetLogo, CoinLogo, NumberInput } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

import { YieldFractionButtons } from './YieldFractionButtons';
import type { YieldFlowDisplayToken, YieldFlowFormValues } from './types';

type YieldAmountCardSummaryProps = {
    token: YieldFlowDisplayToken;
    value: string;
    labelTranslationId?: TranslationKey;
};

type YieldAmountCardHeadingProps = {
    amountLabelTranslationId?: TranslationKey;
    switchCurrencyLabel?: string;
    isSwitchDisabled?: boolean;
    onSwitchCurrency?: () => void;
};

type YieldAmountCardProps = {
    amount: string;
    tokenSymbol: string;
    fractionMaxAmount: string;
    tokenDecimals: number;
    amountError?: string | null;
    isDisabled?: boolean;
    summary?: YieldAmountCardSummaryProps;
    heading?: YieldAmountCardHeadingProps;
    onAmountChange: (amount: string) => void;
    onFractionClick: (amount: string) => void;
};

export const YieldAmountCard = ({
    amount,
    tokenSymbol,
    fractionMaxAmount,
    tokenDecimals,
    amountError,
    isDisabled = false,
    summary,
    heading,
    onAmountChange,
    onFractionClick,
}: YieldAmountCardProps) => {
    const locale = useSelector(selectLanguage);
    const { control, setValue } = useFormContext<YieldFlowFormValues>();

    useEffect(() => {
        setValue('amountInput', amount);
    }, [amount, setValue]);

    return (
        <Card paddingType="none">
            <Column gap={0} hasDivider>
                {summary && (
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 16, horizontal: 20 }}
                    >
                        <Text typographyStyle="body-md">
                            <Translation id={summary.labelTranslationId ?? 'TR_STAKE_AVAILABLE'} />
                        </Text>
                        <Row alignItems="center" gap={8}>
                            {summary.token.coingeckoId ? (
                                <AssetLogo
                                    size={24}
                                    coingeckoId={summary.token.coingeckoId}
                                    placeholder={summary.token.symbol}
                                    symbol={summary.token.networkSymbol}
                                    contractAddress={summary.token.contractAddress}
                                    showNetworkIcon
                                />
                            ) : (
                                <CoinLogo
                                    size={24}
                                    symbol={summary.token.networkSymbol}
                                    type="tokenWithNetwork"
                                />
                            )}
                            <Text typographyStyle="body-md-strong">{summary.value}</Text>
                        </Row>
                    </Row>
                )}

                <Column gap={8} width="100%" padding={{ vertical: 16, horizontal: 20 }}>
                    <Row justifyContent="space-between" alignItems="center" gap={16}>
                        <Text typographyStyle="body-md">
                            <Translation
                                id={
                                    heading?.amountLabelTranslationId ??
                                    'TR_EARN_YIELD_AMOUNT_TO_SUPPLY'
                                }
                            />
                        </Text>
                        {heading?.switchCurrencyLabel && heading.onSwitchCurrency && (
                            <TextButton
                                size="small"
                                type="button"
                                onClick={heading.onSwitchCurrency}
                                isDisabled={isDisabled || heading.isSwitchDisabled === true}
                            >
                                <Translation
                                    id="TR_TRADING_ENTER_AMOUNT_IN"
                                    values={{ currency: heading.switchCurrencyLabel }}
                                />
                            </TextButton>
                        )}
                    </Row>
                    <NumberInput
                        name="amountInput"
                        locale={locale}
                        control={control}
                        onChange={onAmountChange}
                        isDisabled={isDisabled}
                        hasError={!!amountError}
                        bottomText={amountError ?? null}
                        maxLength={formInputsMaxLength.amount}
                        rightContent={
                            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                                {tokenSymbol}
                            </Text>
                        }
                    />

                    <YieldFractionButtons
                        maxAmount={fractionMaxAmount}
                        decimals={tokenDecimals}
                        isDisabled={isDisabled}
                        onFractionClick={onFractionClick}
                    />
                </Column>
            </Column>
        </Card>
    );
};
