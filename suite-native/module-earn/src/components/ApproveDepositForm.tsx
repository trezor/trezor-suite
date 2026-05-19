import { type ReactNode } from 'react';

import { type TokenSymbol } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';

import { YieldDepositAmountInputCard } from './YieldDepositAmountInputCard';
import { YieldDepositStepCard } from './YieldDepositStepCard';

type ApproveDepositFormProps = {
    approvalLimitTitle: ReactNode;
    balance: string;
    feeSelector: ReactNode;
    isApprovalLimitDisabled?: boolean;
    isMaxSelected: boolean;
    onAmountChange: () => void;
    onApprovalLimitPress: () => void;
    onMaxChange: (value: boolean) => void;
    tokenSymbol: TokenSymbol;
};

export const ApproveDepositForm = ({
    approvalLimitTitle,
    balance,
    feeSelector,
    isApprovalLimitDisabled = false,
    isMaxSelected,
    onAmountChange,
    onApprovalLimitPress,
    onMaxChange,
    tokenSymbol,
}: ApproveDepositFormProps) => (
    <VStack spacing="sp16">
        <YieldDepositStepCard currentStepIndex={0} />

        <Box paddingHorizontal="sp16">
            <YieldDepositAmountInputCard
                approvalLimitTitle={approvalLimitTitle}
                balance={balance}
                isApprovalLimitDisabled={isApprovalLimitDisabled}
                isMaxSelected={isMaxSelected}
                onAmountChange={onAmountChange}
                onApprovalLimitPress={onApprovalLimitPress}
                onMaxChange={onMaxChange}
                tokenSymbol={tokenSymbol}
            />
        </Box>
        <Box paddingHorizontal="sp16">{feeSelector}</Box>
    </VStack>
);
