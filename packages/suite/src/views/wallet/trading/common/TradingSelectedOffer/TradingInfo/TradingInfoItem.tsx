import { CryptoId } from 'invity-api';

import { ExperimentId } from '@suite-common/message-system';
import {
    TradingExchangeStepType,
    TradingSellStepType,
    type TradingType,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Box, Column, InfoItem, Row, Text } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { copyAddressToClipboard } from 'src/actions/suite/copyAddressActions';
import { AccountLabel, BaseCurrencyValue } from 'src/components/suite';
import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { Translation } from 'src/components/suite/Translation';
import { TokenAddressRow } from 'src/components/suite/copy/TokenAddressRow';
import { useTranslation } from 'src/hooks/suite';
import { TradingPayGetLabelType } from 'src/types/trading/trading';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';

function isFormStepWithAccountLabel({
    formStep,
    isReceive,
    account,
    type,
}: Pick<TradingInfoItemProps, 'formStep' | 'isReceive' | 'account' | 'type'>): boolean {
    return Boolean(
        (['SEND_TRANSACTION', 'SIGN_DATA'].some(f => f === formStep) || !isReceive) &&
            account &&
            type !== 'sell',
    );
}

interface TradingInfoItemProps {
    account?: Account;
    type: TradingType;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
    formStep?: TradingExchangeStepType | TradingSellStepType;
    receiveAddress?: string;
}

export const TradingInfoItem = ({
    account,
    type,
    isReceive,
    label,
    currency,
    amount,
    formStep,
    receiveAddress,
}: TradingInfoItemProps) => {
    const { translationString } = useTranslation();
    const currencyInfo = currency && cryptoIdToNetworkSymbolAndContractAddress(currency);
    const accountLabelPrefix = translationString(isReceive ? 'TR_TO' : 'TR_FROM').toLowerCase();

    const showAccountLabel = isFormStepWithAccountLabel({ formStep, isReceive, account, type });

    // `account` is undefined for external addresses
    const isExternalBuyOrExchange =
        (type === 'exchange' || type === 'buy') && !account && !!receiveAddress;

    return type === 'exchange' || isReceive ? (
        <Column width="100%">
            <Row justifyContent="space-between">
                <Text variant="tertiary" typographyStyle="hint">
                    <Translation id={label} />
                </Text>
                {(showAccountLabel || isExternalBuyOrExchange) && (
                    <Text variant="tertiary" typographyStyle="hint" as="div">
                        <Row>
                            {accountLabelPrefix}&nbsp;
                            {isExternalBuyOrExchange && (
                                <TokenAddressRow
                                    tokenContractAddress={receiveAddress}
                                    shouldAllowCopy={true}
                                    onCopy={() => copyAddressToClipboard(receiveAddress)}
                                />
                            )}
                            {!isExternalBuyOrExchange && account && (
                                <AccountLabel
                                    account={account}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                />
                            )}
                        </Row>
                    </Text>
                )}
            </Row>
            <Box
                margin={{ top: spacings.xs }}
                borderWidth={borders.widths.medium}
                borderRadius={borders.radii.sm}
                padding={spacings.md}
            >
                {amount && currency && (
                    <Row gap={spacings.xs} alignItems="start">
                        <TradingCoinLogo cryptoId={currency} size={24} />
                        <Column>
                            <TradingCryptoAmount amount={amount} cryptoId={currency} />
                            <ExperimentWrapper
                                id={ExperimentId.tradingFiatValues}
                                components={[
                                    { variant: 'A', element: <></> },
                                    {
                                        variant: 'B',
                                        element: currencyInfo?.symbol ? (
                                            <Text variant="tertiary" typographyStyle="hint">
                                                <BaseCurrencyValue
                                                    amount={amount}
                                                    symbol={currencyInfo.symbol}
                                                    rateType="current"
                                                    tokenAddress={
                                                        currencyInfo.contractAddress as
                                                            | TokenAddress
                                                            | undefined
                                                    }
                                                    showApproximationIndicator
                                                />
                                            </Text>
                                        ) : (
                                            <></>
                                        ),
                                    },
                                ]}
                            />
                        </Column>
                    </Row>
                )}
            </Box>
        </Column>
    ) : (
        <InfoItem label={<Translation id={label} />} direction="row">
            <Row data-testid="@trading/form/info/fiat-amount">
                <TradingFiatAmount
                    amount={
                        amount !== undefined
                            ? asBaseCurrencyAmount(new BigNumber(amount))
                            : undefined
                    }
                    currency={currency}
                />
            </Row>
        </InfoItem>
    );
};
