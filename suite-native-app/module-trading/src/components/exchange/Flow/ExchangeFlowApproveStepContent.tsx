import type { DexApprovalType } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

import { ExchangeFlowApprovalFeeSelectorRow } from './ExchangeFlowApprovalFeeSelectorRow';
import { LimitPicker } from '../Approval/LimitPicker';

export type ExchangeFlowApproveStepContentProps = {
    accountKey: AccountKey;
    coinSymbol?: string;
    onApprovalTypeChange: (approvalType: DexApprovalType) => void;
};

export const ExchangeFlowApproveStepContent = ({
    accountKey,
    coinSymbol,
    onApprovalTypeChange,
}: ExchangeFlowApproveStepContentProps) => (
    <>
        <CurrentStepCardHeader>
            <Text variant="headline-sm">
                <Translation id="moduleTrading.tradingExchangeFlowScreen.approveStep.title" />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleTrading.tradingExchangeFlowScreen.approveStep.description"
                    values={{ symbol: coinSymbol }}
                />
            </Text>
        </CurrentStepCardHeader>
        <LimitPicker onApprovalTypeChange={onApprovalTypeChange} />
        <ExchangeFlowApprovalFeeSelectorRow accountKey={accountKey} />
    </>
);
