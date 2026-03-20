import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type FormDraftRootState, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import type { FeeLevelLabel } from '@suite-common/wallet-types';
import { AnimatedCard, Divider, InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import {
    getFormDraftKeyByTradeType,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { FeeSelector } from '@suite-native/transaction-management';

import { LimitPicker } from './LimitPicker';
import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

type ExchangeApprovalDetailsProps = {
    exchange: string | undefined;
};

export const ExchangeApprovalDetails = ({ exchange }: ExchangeApprovalDetailsProps) => {
    const account = useSelector(selectExchangeSelectedSendAccount);
    const formDraftKey = getFormDraftKeyByTradeType('exchange');
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

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
                <LimitPicker />
            </NetworkAndAccountCard>

            <AnimatedCard noPadding>
                <Divider />
                <FeeSelector
                    accountKey={account.key}
                    updateThunk={updateTradingSelectedFeeLevelThunk}
                    selectedFee={(formDraft?.selectedFee as FeeLevelLabel | undefined) ?? 'normal'}
                    selectedFeePerUnit={formDraft?.feePerUnit}
                    formDraft={formDraft}
                    formDraftKey={formDraftKey}
                />
            </AnimatedCard>
        </>
    );
};
