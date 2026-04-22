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

import { YieldSupplyApprovalLimitCard } from './YieldSupplyApprovalLimitCard';
import { type YieldApprovalLimitType } from '../types';

type YieldSupplyApprovalLimitBottomSheetProps = {
    accountSymbol: NetworkSymbol;
    onApprovalLimitSelect: (approvalLimitType: YieldApprovalLimitType) => void;
    onClose: () => void;
    ref: BottomSheetModalRef;
    selectedApprovalLimitType: YieldApprovalLimitType;
    tokenContract: TokenAddress;
    tokenSymbol: string;
};

export const YieldSupplyApprovalLimitBottomSheet = ({
    accountSymbol,
    onApprovalLimitSelect,
    onClose,
    ref,
    selectedApprovalLimitType,
    tokenContract,
    tokenSymbol,
}: YieldSupplyApprovalLimitBottomSheetProps) => {
    const handleSelect = (approvalLimitType: YieldApprovalLimitType) => {
        onApprovalLimitSelect(approvalLimitType);
        onClose();
    };

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.yieldSupplyFlowScreen.approvalLimitSheet.title" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <VStack spacing="sp12" paddingBottom="sp12">
                <YieldSupplyApprovalLimitCard
                    title={
                        <Text variant="body-sm-strong" color="contentPrimary">
                            <Translation id="earn.yieldSupplyFlowScreen.perSupply" />
                        </Text>
                    }
                    description={
                        <Translation id="earn.yieldSupplyFlowScreen.approvalLimitSheet.perSupply.description" />
                    }
                    symbol={accountSymbol}
                    contractAddress={tokenContract}
                    isChecked={selectedApprovalLimitType === 'per-supply'}
                    onChange={() => handleSelect('per-supply')}
                />
                <YieldSupplyApprovalLimitCard
                    title={
                        <Text variant="body-sm-strong" color="contentPrimary">
                            <Translation id="earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.title" />
                        </Text>
                    }
                    description={
                        <Translation id="earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.description" />
                    }
                    symbol={accountSymbol}
                    contractAddress={tokenContract}
                    isChecked={selectedApprovalLimitType === 'unlimited'}
                    onChange={() => handleSelect('unlimited')}
                >
                    <InlineAlertBox
                        title={
                            <Translation
                                id="earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.alert"
                                values={{ tokenSymbol }}
                            />
                        }
                        variant="warning"
                    />
                </YieldSupplyApprovalLimitCard>
            </VStack>
        </BottomSheetModal>
    );
};
