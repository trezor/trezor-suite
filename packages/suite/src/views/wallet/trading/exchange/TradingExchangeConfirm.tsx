import { Translation } from '@suite/intl';
import {
    selectTradingExchangeApprovalFlow,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { FlowStep, FlowStepList } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { useTradingExchangeConfirm } from 'src/hooks/wallet/trading/useTradingExchangeConfirm';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';
import { TradingOfferExchange } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchange';

export const TradingExchangeConfirm = () => {
    useTradingExchangeConfirm();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const provider = useSelector(state =>
        selectTradingProviderByNameAndTradeType(state, selectedQuote?.exchange, 'exchange'),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const approvalFlow = useSelector(selectTradingExchangeApprovalFlow);
    const stepLabel = approvalFlow && (
        <Translation
            id="TR_STEP_OF_TOTAL"
            values={{ index: approvalFlow.steps.length, total: approvalFlow.steps.length }}
        />
    );
    useTradingPageHeader();

    return (
        <>
            {isDiscoveryRunning && (
                <Column margin={{ bottom: 16 }}>
                    <DiscoveryWarning />
                </Column>
            )}
            <Column width="100%" maxWidth="440px" alignSelf="center">
                <FlowStepList data-testid="@approval-steps">
                    {approvalFlow && (
                        <FlowStep
                            state="done"
                            label={null}
                            title={<Translation id="TR_APPROVAL_STEP_DONE_APPROVE" />}
                            data-testid="@approval-step/approve"
                        />
                    )}
                    <TradingOfferExchange stepLabel={stepLabel} />
                </FlowStepList>
            </Column>
            <TradingFooter provider={provider} />
        </>
    );
};
