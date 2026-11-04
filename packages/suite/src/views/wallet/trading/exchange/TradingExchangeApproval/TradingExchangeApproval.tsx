import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    parseCryptoId,
    selectTradingExchangeFormValues,
    selectTradingExchangeProviders,
} from '@suite-common/trading';
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { FlowStep, FlowStepList } from '@trezor/product-components';

import { ALLOWANCE_STEP_TEXT_ID } from 'src/components/wallet/Allowance/AllowanceStepCard';
import { ApprovalRequiredBadge } from 'src/components/wallet/Allowance/ApprovalRequiredBadge';
import { getTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

import { TradingExchangeApprovalStepCard } from './TradingExchangeApprovalStepCard';
import { useTradingExchangeApprovalFlow } from './useTradingExchangeApprovalFlow';

export const TradingExchangeApproval = () => {
    useTradingPageHeader();
    const { account, quote, steps, isFlowMissing } = useTradingExchangeApprovalFlow();
    const formValues = useSelector(selectTradingExchangeFormValues);
    const exchangeProviders = useSelector(selectTradingExchangeProviders);

    if (isFlowMissing || !account || !quote?.send) {
        return null;
    }

    const { contractAddress: tokenContractAddress } = parseCryptoId(quote.send);
    const spender = getErc20ApproveSpender(quote.dexTx?.data);
    const sendSymbol = formValues?.sendCryptoSelect?.displaySymbol ?? '';

    const getCryptoInfo = () =>
        getTradingExchangeCryptoInfo({
            values: formValues ?? {},
            quoteExchange: quote.exchange,
            exchangeProviders,
        });

    return (
        <Column width="100%" maxWidth="440px" alignSelf="center">
            <FlowStepList data-testid="@approval-steps">
                {steps.map(({ type, status }, index) => {
                    const label = (
                        <Translation
                            id="TR_STEP_OF_TOTAL"
                            values={{ index: index + 1, total: steps.length }}
                        />
                    );

                    if (type === 'swap' || status === 'done' || status === 'upcoming') {
                        return (
                            <FlowStep
                                key={type}
                                state={status === 'done' ? 'done' : 'upcoming'}
                                label={label}
                                title={
                                    <Translation
                                        id={
                                            type === 'swap'
                                                ? 'TR_TRADING_SWAP'
                                                : ALLOWANCE_STEP_TEXT_ID[type].done
                                        }
                                    />
                                }
                                addon={
                                    type === 'swap' && <ApprovalRequiredBadge symbol={sendSymbol} />
                                }
                                data-testid={`@approval-step/${type}`}
                            />
                        );
                    }

                    if (!tokenContractAddress || !spender) {
                        return null;
                    }

                    return (
                        <TradingExchangeApprovalStepCard
                            key={type}
                            variant={type}
                            state={status}
                            step={index + 1}
                            totalSteps={steps.length}
                            account={account}
                            quote={quote}
                            tokenContractAddress={tokenContractAddress}
                            spender={spender}
                            getCryptoInfo={getCryptoInfo}
                        />
                    );
                })}
            </FlowStepList>
        </Column>
    );
};
