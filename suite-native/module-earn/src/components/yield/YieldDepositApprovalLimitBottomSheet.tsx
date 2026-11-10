import { TokenMetadataProvider, useTokenMetadataSources } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AllowanceLimitType } from '@suite-common/wallet-types';
import {
    BannerInline,
    BottomSheetModal,
    type BottomSheetModalRef,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TokenSymbol } from '@suite-native/tokens';

import { YieldDepositApprovalLimitCard } from './YieldDepositApprovalLimitCard';

type YieldDepositApprovalLimitBottomSheetProps = {
    accountSymbol: NetworkSymbol;
    onApprovalLimitSelect: (approvalLimitType: AllowanceLimitType) => void;
    onClose: () => void;
    ref: BottomSheetModalRef;
    selectedApprovalLimitType: AllowanceLimitType;
    tokenContract: TokenAddress;
};

export const YieldDepositApprovalLimitBottomSheet = ({
    accountSymbol,
    onApprovalLimitSelect,
    onClose,
    ref,
    selectedApprovalLimitType,
    tokenContract,
}: YieldDepositApprovalLimitBottomSheetProps) => {
    // The sheet renders in a portal outside the flow's metadata provider.
    const metadataSources = useTokenMetadataSources();
    const handleSelect = (approvalLimitType: AllowanceLimitType) => {
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
            <TokenMetadataProvider sources={metadataSources}>
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
                        isChecked={selectedApprovalLimitType === 'minimal'}
                        onChange={() => handleSelect('minimal')}
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
                        <BannerInline
                            title={
                                <Translation
                                    id="earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.alert"
                                    values={{
                                        tokenSymbol: (
                                            <TokenSymbol
                                                networkSymbol={accountSymbol}
                                                contractAddress={tokenContract}
                                                // Nested Text does not inherit the banner's style.
                                                variant="body-sm"
                                                color="contentWarning"
                                            />
                                        ),
                                    }}
                                />
                            }
                            intent="warning"
                        />
                    </YieldDepositApprovalLimitCard>
                </VStack>
            </TokenMetadataProvider>
        </BottomSheetModal>
    );
};
