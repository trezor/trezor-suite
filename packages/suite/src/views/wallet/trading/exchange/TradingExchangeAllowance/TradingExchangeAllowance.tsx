import { Translation } from '@suite/intl';
import { getExchangeAllowanceCoverage } from '@suite-common/trading';
import { Banner, Card, Column, Spinner, Text } from '@trezor/components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useTradingPageHeader } from '#src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

import { TradingExchangeAllowanceMeter } from './TradingExchangeAllowanceMeter';
import { TradingExchangeAllowanceRevoke } from './TradingExchangeAllowanceRevoke';
import {
    getExchangeAllowanceDescriptionId,
    getExchangeAllowanceHeadingId,
} from './exchangeAllowancePageUtils';
import { useTradingExchangeAllowanceFlow } from './useTradingExchangeAllowanceFlow';

export const TradingExchangeAllowance = () => {
    const {
        isDataMissing,
        account,
        quote,
        token,
        spender,
        provider,
        currentAllowance,
        isFirstReadRunning,
        revokeTxid,
        hasRevoked,
        onRevokeSent,
        continueSwap,
        reportAction,
    } = useTradingExchangeAllowanceFlow();
    useTradingPageHeader();

    if (isDataMissing || !account || !quote || !token || !provider) {
        return null;
    }

    if (!spender) {
        return (
            <Column width="100%" maxWidth="440px" alignSelf="center" alignItems="center">
                <Spinner size={32} />
            </Column>
        );
    }

    const neededAmount = quote.sendStringAmount;
    const coverage = getExchangeAllowanceCoverage({
        amount: currentAllowance.amount,
        neededAmount,
        decimals: token.decimals,
        tokenContractAddress: token.contractAddress,
    });
    const values = {
        provider: provider.companyName ?? provider.name ?? '',
        displaySymbol: token.symbol,
        needed:
            neededAmount !== undefined ? (
                <FormattedCryptoAmount
                    value={neededAmount}
                    symbol={token.symbol}
                    contractAddress={token.contractAddress}
                    tokenDecimals={token.decimals}
                    isCompact
                />
            ) : (
                ''
            ),
    };

    return (
        <Column width="100%" maxWidth="440px" alignSelf="center">
            <Card paddingType="large">
                <Column gap={20}>
                    <Column gap={8}>
                        <Text
                            typographyStyle="headline-sm"
                            as="h2"
                            data-testid="@trading/allowance/heading"
                        >
                            <Translation
                                id={getExchangeAllowanceHeadingId({ coverage, hasRevoked })}
                                values={values}
                            />
                        </Text>
                        <Text
                            typographyStyle="body-md"
                            intent="neutral"
                            priority="secondary"
                            data-testid="@trading/allowance/description"
                        >
                            <Translation
                                id={getExchangeAllowanceDescriptionId(coverage)}
                                values={values}
                            />
                        </Text>
                    </Column>

                    <TradingExchangeAllowanceMeter
                        coverage={coverage}
                        token={token}
                        allowedAmount={currentAllowance.amount}
                        neededAmount={neededAmount}
                        isLoading={isFirstReadRunning}
                    />

                    {coverage.kind === 'unlimited' && (
                        <Banner
                            intent="warning"
                            icon
                            description={
                                <Translation
                                    id="TR_EXCHANGE_ALLOWANCE_UNLIMITED_WARNING"
                                    values={values}
                                />
                            }
                            data-testid="@trading/allowance/unlimited-warning"
                        />
                    )}

                    <TradingExchangeAllowanceRevoke
                        account={account}
                        token={token}
                        spender={spender}
                        canRevoke={coverage.kind !== 'none'}
                        isFirstReadRunning={isFirstReadRunning}
                        revokeTxid={revokeTxid}
                        onReportAction={reportAction}
                        onRevokeSent={onRevokeSent}
                        onContinueSwap={continueSwap}
                    />
                </Column>
            </Card>
        </Column>
    );
};
