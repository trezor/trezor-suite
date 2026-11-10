import { useDevice } from '@suite/device';
import { Form } from '@suite/form';
import { Translation, type TranslationKey } from '@suite/intl';
import { TokenSymbol } from '@suite/token';
import { toTokenAddress } from '@suite-common/tokens';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, type AllowanceLimitType } from '@suite-common/wallet-types';
import { Banner, CardList, Column, Modal } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { AllowanceAccountRow } from './AllowanceAccountRow';
import { AllowanceCalldataDebug } from './AllowanceCalldataDebug';
import { AllowanceCurrentLimitRow } from './AllowanceCurrentLimitRow';
import { AllowanceFees } from './AllowanceFees';
import { AllowanceLimitSelector } from './AllowanceLimitSelector';
import { type AllowanceProvider, AllowanceProviderInfo } from './AllowanceProviderInfo';
import { useAllowanceTransaction } from './hooks/useAllowanceTransaction';

type ApproveModalProps = {
    amount: string;
    account: Account;
    tokenContractAddress: string;
    provider: AllowanceProvider;
    spender: string;
    showSpender?: boolean;
    preapprovedAmount?: string;
    heading: TranslationKey;
    description: TranslationKey;
    onSelectLimitType?: (limitType: AllowanceLimitType) => void;
    onConfirm?: (limitType: AllowanceLimitType) => void;
    onSendStart?: () => void;
    onSent: (txid: string) => void;
    onSendFailed?: () => void;
    onCancel?: () => void;
};

export const ApproveModal = ({
    amount,
    account,
    tokenContractAddress,
    provider,
    spender,
    showSpender,
    preapprovedAmount,
    heading,
    description,
    onSelectLimitType,
    onConfirm,
    onSendStart,
    onSent,
    onSendFailed,
    onCancel,
}: ApproveModalProps) => {
    const { device } = useDevice();
    const { handleClick, disabled: isConfirmInProgress } = useAsyncClickHandler();

    const {
        inputAmount,
        feeInfo,
        token,
        limitType,
        isComposing,
        isSending,
        composedLevels,
        composedLevelsError,
        canSubmit,
        data,
        methods,
        selectLimitType,
        handleCancel,
        handleFeeChange,
        confirmAndSend,
    } = useAllowanceTransaction({
        type: 'approve',
        amount,
        account,
        tokenContractAddress,
        spender,
        onSelectLimitType,
        onConfirm,
        onSendStart,
        onSent,
        onSendFailed,
        onCancel,
    });

    // The device review takes over while the transaction is signed; the modal shows again only
    // when the signing fails, so the user can retry or cancel.
    if (!token?.symbol || isSending) return null;

    const displaySymbol = getDisplaySymbol(token.symbol, token.contract);
    const symbolLabel = (
        <TokenSymbol
            networkSymbol={account.symbol}
            tokenContract={toTokenAddress(token.contract)}
            isTruncated
        />
    );
    const currentLimit =
        preapprovedAmount && preapprovedAmount !== '0' ? preapprovedAmount : undefined;
    const hasCurrentLimit = currentLimit !== undefined;

    const { formState } = methods;

    return (
        <Form form={methods} formState={formState}>
            <Modal
                onCancel={handleCancel}
                intent="brand"
                width={480}
                heading={<Translation id={heading} values={{ displaySymbol: symbolLabel }} />}
                description={<Translation id={description} values={{ displaySymbol: symbolLabel }} />}
                bottomContent={
                    <>
                        <Modal.Button
                            data-testid="@modal/approve/continue-button"
                            isLoading={isComposing || isConfirmInProgress}
                            isDisabled={!device?.connected || !canSubmit || isConfirmInProgress}
                            onClick={() => handleClick(confirmAndSend)}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>

                        <Modal.Button intent="neutral" priority="secondary" onClick={handleCancel}>
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <Column gap={8}>
                    {hasCurrentLimit && (
                        <Banner
                            intent="info"
                            icon={InfoIcon}
                            description={<Translation id="TR_APPROVAL_MODAL_APPROVE_BANNER" />}
                        />
                    )}
                    <CardList>
                        <AllowanceAccountRow account={account} />
                        <AllowanceProviderInfo
                            provider={provider}
                            spender={spender}
                            showSpender={showSpender}
                        />
                        {currentLimit !== undefined && (
                            <AllowanceCurrentLimitRow
                                label="TR_APPROVAL_CURRENT_LIMIT"
                                networkSymbol={account.symbol}
                                contractAddress={token.contract}
                                symbol={displaySymbol}
                                decimals={token.decimals}
                                amount={currentLimit}
                            />
                        )}
                        <AllowanceLimitSelector
                            limitType={limitType}
                            isLoading={isComposing}
                            networkSymbol={account.symbol}
                            onSelect={selectLimitType}
                            provider={provider}
                            token={token}
                            displayAmount={inputAmount}
                            hasPreapprovedAmount={hasCurrentLimit}
                        />
                    </CardList>

                    <AllowanceCalldataDebug data={data} />

                    <AllowanceFees
                        account={account}
                        feeInfo={feeInfo}
                        composedLevels={composedLevels}
                        onFeeLevelChange={handleFeeChange}
                        error={composedLevelsError}
                    />
                </Column>
            </Modal>
        </Form>
    );
};
