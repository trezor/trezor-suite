import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    InlineAlertBox,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldDepositApprovalLimitCard } from './YieldDepositApprovalLimitCard';
import { type YieldApprovalLimitType } from '../types';

type YieldDepositApprovalLimitBottomSheetProps = {
    accountSymbol: NetworkSymbol;
    onApprovalLimitSelect: (approvalLimitType: YieldApprovalLimitType) => void;
    onClose: () => void;
    ref: BottomSheetModalRef;
    selectedApprovalLimitType: YieldApprovalLimitType;
    tokenContract: TokenAddress;
    tokenSymbol: string;
};

export const YieldDepositApprovalLimitBottomSheet = ({
    accountSymbol,
    onApprovalLimitSelect,
    onClose,
    ref,
    selectedApprovalLimitType,
    tokenContract,
    tokenSymbol,
}: YieldDepositApprovalLimitBottomSheetProps) => {
    const handleSelect = (approvalLimitType: YieldApprovalLimitType) => {
        onApprovalLimitSelect(approvalLimitType);
        onClose();
    };

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.title" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <VStack spacing="sp12" paddingBottom="sp12">
                <YieldDepositApprovalLimitCard
                    title={
                        <Text variant="body-sm-strong" color="contentPrimary">
                            <Translation id="earn.yieldDepositFlowScreen.perDeposit" />
                        </Text>
                    }
                    description={
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.perDeposit.description" />
                    }
                    symbol={accountSymbol}
                    contractAddress={tokenContract}
                    isChecked={selectedApprovalLimitType === 'per-deposit'}
                    onChange={() => handleSelect('per-deposit')}
                />
                <YieldDepositApprovalLimitCard
                    title={
                        <Text variant="body-sm-strong" color="contentPrimary">
                            <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title" />
                        </Text>
                    }
                    description={
                        <Translation id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.description" />
                    }
                    symbol={accountSymbol}
                    contractAddress={tokenContract}
                    isChecked={selectedApprovalLimitType === 'unlimited'}
                    onChange={() => handleSelect('unlimited')}
                >
                    <InlineAlertBox
                        title={
                            <Translation
                                id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.alert"
                                values={{ tokenSymbol }}
                            />
                        }
                        intent="warning"
                    />
                </YieldDepositApprovalLimitCard>
            </VStack>
        </BottomSheetModal>
    );
};
