import type { DexApprovalType } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { Divider, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { CurrentStepCardHeader } from '@suite-native/step-cards';

import { ExchangeFlowApprovalFeeSelectorRow } from './ExchangeFlowApprovalFeeSelectorRow';
import { LimitPicker } from '../Approval/LimitPicker';
import { OriginalLimit } from '../Approval/OriginalLimit';

export type ExchangeFlowIncreaseStepContentProps = {
    accountKey: AccountKey;
    coinSymbol?: string;
    onApprovalTypeChange: (approvalType: DexApprovalType) => void;
};

export const ExchangeFlowIncreaseStepContent = ({
    accountKey,
    coinSymbol,
    onApprovalTypeChange,
}: ExchangeFlowIncreaseStepContentProps) => (
    <>
        <CurrentStepCardHeader>
            <Text variant="headline-sm">
                <Translation id="moduleTrading.tradingExchangeFlowScreen.increaseStep.title" />
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation
                    id="moduleTrading.tradingExchangeFlowScreen.increaseStep.description"
                    values={{ symbol: coinSymbol }}
                />
            </Text>
        </CurrentStepCardHeader>
        <OriginalLimit />
        <LimitPicker onApprovalTypeChange={onApprovalTypeChange} />
        <Divider testID="@exchange-flow/increase/fee-divider" />
        <ExchangeFlowApprovalFeeSelectorRow accountKey={accountKey} />
    </>
);
