import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import { FormDraftRootState, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import {
    selectSellSelectedSendAccount,
    selectTradingProviderConfirmationStatus,
} from '@suite-native/trading-state';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';

export type SellFeePickerCardProps = {
    quote?: SellFiatTrade;
    isTxnError: boolean;
};

export const SellFeePickerCard = ({ quote, isTxnError }: SellFeePickerCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);
    const providerConfirmationStatus = useSelector(selectTradingProviderConfirmationStatus);

    const isTradeConfirmedOnProviderSide = providerConfirmationStatus === 'confirmation_success';

    const formDraftKey = getFormDraftKey('trading-sell' as FormDraftKeyPrefix, '');
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

    if (!fromAccount || !quote?.cryptoCurrency || isTxnError || !isTradeConfirmedOnProviderSide) {
        return null;
    }

    return (
        <FeeSummaryCard
            accountKey={fromAccount.key}
            updateThunk={updateTradingSelectedFeeLevelThunk}
            formDraft={formDraft}
            formDraftKey={formDraftKey}
        />
    );
};
