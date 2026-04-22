import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { DexApprovalType } from 'invity-api';

import { useFormDraft } from '@suite-common/wallet-core';
import type { FormState } from '@suite-common/wallet-types';
import { Card, InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { FeeSelector } from '@suite-native/transaction-management';

import { LimitPicker } from './LimitPicker';
import { OriginalLimit } from './OriginalLimit';
import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

type ExchangeApprovalDetailsProps = {
    exchange: string | undefined;
    onApprovalTypeChange: (approvalType: DexApprovalType) => void;
};

export const ExchangeApprovalDetails = ({
    exchange,
    onApprovalTypeChange,
}: ExchangeApprovalDetailsProps) => {
    const account = useSelector(selectExchangeSelectedSendAccount);
    const { draft: formDraft, formDraftKey } = useFormDraft<FormState>('trading-exchange');

    useEffect(() => {
        if (!account) {
            console.error('No account selected for exchange approval details');
        }
    }, [account]);

    if (!account) {
        return (
            <InlineAlertBox
                title={
                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert" />
                }
                variant="critical"
            />
        );
    }

    return (
        <>
            <NetworkAndAccountCard
                account={account}
                title={<Translation id="moduleTrading.exchangeTradePreviewCard.account" />}
            >
                <ProviderInfoRow exchange={exchange} />
                <OriginalLimit />
                <LimitPicker onApprovalTypeChange={onApprovalTypeChange} />
            </NetworkAndAccountCard>

            <Card noPadding>
                <FeeSelector
                    accountKey={account.key}
                    updateThunk={updateTradingSelectedFeeLevelThunk}
                    selectedFee={formDraft?.selectedFee ?? 'normal'}
                    selectedFeePerUnit={formDraft?.feePerUnit}
                    formDraft={formDraft}
                    formDraftKey={formDraftKey}
                />
            </Card>
        </>
    );
};
