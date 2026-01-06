import { CryptoId } from 'invity-api';

import { ExperimentId } from '@suite-common/message-system';
import { type TradingType, cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { Box, Column, Row, Text } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { AccountLabel, Address, BaseCurrencyValue } from 'src/components/suite';
import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { Translation } from 'src/components/suite/Translation';
import { useTranslation } from 'src/hooks/suite';
import { TradingPayGetLabelType } from 'src/types/trading/trading';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';

interface TradingInfoItemProps {
    account?: Account;
    type: TradingType;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
    receiveAddress?: string;
}

export const TradingInfoItem = ({
    account,
    type,
    isReceive,
    label,
    currency,
    amount,
    receiveAddress,
}: TradingInfoItemProps) => {
    const { translationString } = useTranslation();

    const currencyInfo = currency && cryptoIdToNetworkSymbolAndContractAddress(currency);
    const accountLabelPrefix = translationString(isReceive ? 'TR_TO' : 'TR_FROM').toLowerCase();

    const showAccountLabel = !!account && type !== 'sell';
    const isExternalExchange = type === 'exchange' && !account && !!receiveAddress;

    if (!amount || !currency) return null;

    return (
        <Column width="100%">
            <Row justifyContent="space-between">
                <Text variant="tertiary" typographyStyle="hint">
                    <Translation id={label} />
                </Text>
                {(showAccountLabel || isExternalExchange) && (
                    <Text variant="tertiary" typographyStyle="hint" as="div">
                        <Row>
                            {accountLabelPrefix}&nbsp;
                            {isExternalExchange && (
                                <Address isCopyAllowed isTruncated value={receiveAddress} />
                            )}
                            {!isExternalExchange && account && (
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
                backgroundColor="backgroundSurfaceElevation2"
            >
                <Row gap={spacings.xs} alignItems="center">
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
            </Box>
        </Column>
    );
};
