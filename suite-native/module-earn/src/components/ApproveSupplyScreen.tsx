import { type ReactNode } from 'react';

import { type TokenSymbol } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';

import { YieldSupplyAmountInputCard } from './YieldSupplyAmountInputCard';
import { YieldSupplyStepCard } from './YieldSupplyStepCard';

type ApproveSupplyScreenProps = {
    approvalLimitTitle: ReactNode;
    balance: string;
    feeSelector: ReactNode;
    isMaxSelected: boolean;
    onAmountChange: () => void;
    onApprovalLimitPress: () => void;
    onMaxChange: (value: boolean) => void;
    tokenSymbol: TokenSymbol;
};

export const ApproveSupplyScreen = ({
    approvalLimitTitle,
    balance,
    feeSelector,
    isMaxSelected,
    onAmountChange,
    onApprovalLimitPress,
    onMaxChange,
    tokenSymbol,
}: ApproveSupplyScreenProps) => (
    <VStack spacing="sp16">
        <YieldSupplyStepCard />

        <Box paddingHorizontal="sp16">
            <YieldSupplyAmountInputCard
                approvalLimitTitle={approvalLimitTitle}
                balance={balance}
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
