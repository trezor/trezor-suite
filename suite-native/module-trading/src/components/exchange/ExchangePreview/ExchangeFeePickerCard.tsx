import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { FormDraftRootState, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { FeeSummaryCard } from '@suite-native/transaction-management';

import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';

export type ExchangeFeePickerCardProps = {
    quote?: ExchangeTrade;
    isTxnError: boolean;
};

export const ExchangeFeePickerCard = ({ quote, isTxnError }: ExchangeFeePickerCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    const formDraftKey = getFormDraftKey('trading-exchange' as FormDraftKeyPrefix, '');
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

    if (!fromAccount || !quote?.send || isTxnError) {
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
