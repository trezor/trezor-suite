import { Translation } from '@suite/intl';
import { getExchangeAllowanceCoverage } from '@suite-common/trading';
import { Banner, Card, Column, Spinner } from '@trezor/components';

import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

import { TradingExchangeAllowanceMeter } from './TradingExchangeAllowanceMeter';
import { TradingExchangeAllowanceRevoke } from './TradingExchangeAllowanceRevoke';
import { TradingExchangeAllowanceSummary } from './TradingExchangeAllowanceSummary';
import { useTradingExchangeAllowanceFlow } from './useTradingExchangeAllowanceFlow';

export const TradingExchangeAllowance = () => {
    const {
        isDataMissing,
        account,
        quote,
        token,
        spender,
        provider,
        explorer,
        allowance,
        currentAllowance,
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

    // The spender is being asked from the provider for an already approved quote.
    if (!spender) {
        return (
            <Column width="100%" maxWidth="440px" alignSelf="center" alignItems="center">
                <Spinner size={32} />
            </Column>
        );
    }

    const providerName = provider.companyName ?? provider.name ?? '';
    const isFirstReadRunning = allowance?.status === 'loading' && allowance.amount === undefined;
    const hasReadFailed = allowance?.status === 'error';

    const neededAmount = quote.sendStringAmount;
    const coverage = getExchangeAllowanceCoverage({
        amount: currentAllowance.amount,
        neededAmount,
        decimals: token.decimals,
        tokenContractAddress: token.contractAddress,
    });
    const showsMeter =
        (coverage.kind === 'too_low' || coverage.kind === 'enough') &&
        neededAmount !== undefined &&
        !isFirstReadRunning;

    return (
        <Column width="100%" maxWidth="440px" alignSelf="center" gap={12}>
            {hasRevoked && (
                <Banner
                    intent="info"
                    description={
                        <Translation
                            id="TR_EXCHANGE_ALLOWANCE_REVOKED"
                            values={{ displaySymbol: token.symbol }}
                        />
                    }
                    data-testid="@trading/allowance/revoked"
                />
            )}

            <Card paddingType="large">
                <Column gap={24}>
                    <TradingExchangeAllowanceSummary
                        coverage={coverage}
                        providerName={providerName}
                        token={token}
                        amount={currentAllowance.amount}
                        neededAmount={neededAmount}
                    />

                    {showsMeter && (
                        <TradingExchangeAllowanceMeter
                            coverage={coverage}
                            token={token}
                            allowedAmount={currentAllowance.amount}
                            neededAmount={neededAmount}
                        />
                    )}

                    <TradingExchangeAllowanceRevoke
                        account={account}
                        token={token}
                        provider={provider}
                        spender={spender}
                        explorer={explorer}
                        coverage={coverage}
                        currentAmount={currentAllowance.amount}
                        currentAmountSource={currentAllowance.source}
                        hasReadFailed={hasReadFailed}
                        readErrorMessage={allowance?.errorMessage}
                        neededAmount={neededAmount}
                        isFirstReadRunning={isFirstReadRunning}
                        revokeTxid={revokeTxid}
                        onRevokeConfirm={() => reportAction('continue')}
                        onRevokeSent={onRevokeSent}
                        onContinueSwap={continueSwap}
                    />
                </Column>
            </Card>
        </Column>
    );
};
