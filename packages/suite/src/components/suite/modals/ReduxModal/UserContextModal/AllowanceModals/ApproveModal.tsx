import { FormProvider } from 'react-hook-form';

import { CryptoId, DexApprovalType, ProviderMetadata } from 'invity-api';

import { Translation } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Box, Column, Modal, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders } from '@trezor/theme';

import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDevice } from 'src/hooks/suite';
import { useAllowanceModal } from 'src/hooks/wallet/allowance';

import { AllowanceModalProviderInfo } from './AllowanceModalProviderInfo';
import { ApproveModalTypeSelector } from './ApproveModalTypeSelector';

interface ApproveModalProps {
    amount: string;
    cryptoId: CryptoId;
    account: Account;
    provider: ProviderMetadata;
    spender: string;
    onSelectApprovalType?: (type: DexApprovalType) => void;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const ApproveModal = (props: ApproveModalProps) => {
    const { account, provider, spender, cryptoId } = props;
    const { device } = useDevice();
    const context = useAllowanceModal({ ...props, type: 'APPROVE' });

    const {
        inputAmount,
        feeInfo,
        token,
        approvalType,
        isLoading,
        composedLevels,
        data,
        methods,
        selectApprovalType,
        handleClose,
        handleFeeChange,
        confirmAndSend,
    } = context;

    if (!token?.symbol) return null;

    return (
        <FormProvider {...methods}>
            <Modal
                onCancel={handleClose}
                intent="brand"
                width={600}
                heading={
                    <Translation
                        id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING"
                        values={{ displaySymbol: getDisplaySymbol(token.symbol, token.contract) }}
                    />
                }
                bottomContent={
                    <>
                        <Modal.Button
                            isLoading={isLoading}
                            isDisabled={!device?.connected}
                            onClick={confirmAndSend}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>

                        <Modal.Button intent="neutral" priority="secondary" onClick={handleClose}>
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                description={
                    <Row margin={{ top: 8 }} gap={4}>
                        <CoinLogo size={20} symbol={account.symbol} />
                        <AccountLabeling
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                        />
                    </Row>
                }
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <Column gap={12}>
                    <AllowanceModalProviderInfo spender={spender} provider={provider} />
                    <ApproveModalTypeSelector
                        approvalType={approvalType}
                        isLoading={isLoading}
                        data={data}
                        cryptoId={cryptoId}
                        onSelect={selectApprovalType}
                        provider={provider}
                        token={token}
                        displayAmount={inputAmount}
                    />

                    <Box
                        padding={12}
                        borderWidth={borders.widths.large}
                        borderRadius={borders.radii.sm}
                    >
                        <Fees
                            label="TR_TX_FEE"
                            feeInfo={feeInfo}
                            account={account}
                            composedLevels={composedLevels}
                            changeFeeLevel={handleFeeChange}
                        />
                    </Box>
                </Column>
            </Modal>
        </FormProvider>
    );
};
