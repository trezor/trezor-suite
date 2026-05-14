import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useFormDraft } from '@suite-common/wallet-core';
import type { FormState } from '@suite-common/wallet-types';
import { Card, InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { FeeSelector } from '@suite-native/transaction-management';

import { RevokeLimitInfoRow } from './RevokeLimitInfoRow';
import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

type ExchangeRevokeDetailsProps = {
    exchange: string | undefined;
};

export const ExchangeRevokeDetails = ({ exchange }: ExchangeRevokeDetailsProps) => {
    const account = useSelector(selectExchangeSelectedSendAccount);
    const { draft: formDraft, formDraftKey } = useFormDraft<FormState>('trading-exchange');

    useEffect(() => {
        if (!account) {
            console.error('No account selected for exchange revoke details');
        }
    }, [account]);

    if (!account) {
        return (
            <InlineAlertBox
                title={
                    <Translation id="moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert" />
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
                <RevokeLimitInfoRow />
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
