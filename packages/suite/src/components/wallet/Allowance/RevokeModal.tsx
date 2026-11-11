import { useDevice } from '@suite/device';
import { Form } from '@suite/form';
import { Translation, type TranslationKey } from '@suite/intl';
import { TokenSymbol } from '@suite/token';
import { toTokenAddress } from '@suite-common/tokens';
import { REVOKE_ALLOWANCE_AMOUNT } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { shouldShowRevokeAllowanceBanner } from '@suite-common/wallet-utils';
import { Banner, CardList, Column, Modal } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { AllowanceAccountRow } from './AllowanceAccountRow';
import { AllowanceCalldataDebug } from './AllowanceCalldataDebug';
import { AllowanceCurrentLimitRow } from './AllowanceCurrentLimitRow';
import { AllowanceFees } from './AllowanceFees';
import { type AllowanceProvider, AllowanceProviderInfo } from './AllowanceProviderInfo';
import { useAllowanceTransaction } from './hooks/useAllowanceTransaction';

type RevokeModalProps = {
    account: Account;
    tokenContractAddress: string;
    provider: AllowanceProvider;
    spender: string;
    showSpender?: boolean;
    preapprovedAmount?: string;
    approveAmount?: string;
    followedByApproval?: boolean;
    heading: TranslationKey;
    description: TranslationKey;
    onConfirm?: () => void;
    onSendStart?: () => void;
    onSent: (txid: string) => void;
    onSendFailed?: () => void;
    onCancel?: () => void;
};

export const RevokeModal = ({
    account,
    tokenContractAddress,
    provider,
    spender,
    showSpender,
    preapprovedAmount,
    approveAmount,
    followedByApproval,
    heading,
    description,
    onConfirm,
    onSendStart,
    onSent,
    onSendFailed,
    onCancel,
}: RevokeModalProps) => {
    const { device } = useDevice();
    const { handleClick, disabled: isConfirmInProgress } = useAsyncClickHandler();

    const {
        feeInfo,
        token,
        isComposing,
        isSending,
        composedLevels,
        composedLevelsError,
        canSubmit,
        data,
        methods,
        handleCancel,
        handleFeeChange,
        confirmAndSend,
    } = useAllowanceTransaction({
        type: 'revoke',
        amount: REVOKE_ALLOWANCE_AMOUNT,
        account,
        tokenContractAddress,
        spender,
        onConfirm,
        onSendStart,
        onSent,
        onSendFailed,
        onCancel,
    });

    // The device review takes over while the transaction is signed; the modal shows again only
    // when the signing fails, so the user can retry or cancel.
    if (!token?.symbol || isSending) return null;

    const symbolLabel = (
        <TokenSymbol
            networkSymbol={account.symbol}
            tokenContract={toTokenAddress(token.contract)}
            isTruncated
        />
    );
    const currentLimit =
        preapprovedAmount && preapprovedAmount !== '0' ? preapprovedAmount : undefined;

    const showRevokeBanner = shouldShowRevokeAllowanceBanner({
        followedByApproval,
        preapprovedAmount,
        approveAmount,
        tokenContractAddress: token.contract,
    });

    const { formState } = methods;

    return (
        <Form form={methods} formState={formState}>
            <Modal
                onCancel={handleCancel}
                intent="brand"
                width={480}
                heading={<Translation id={heading} values={{ displaySymbol: symbolLabel }} />}
                description={
                    !showRevokeBanner && (
                        <Translation id={description} values={{ displaySymbol: symbolLabel }} />
                    )
                }
                bottomContent={
                    <>
                        <Modal.Button
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
                shadowBottom={false}
            >
                <Column gap={8}>
                    {showRevokeBanner && (
                        <Banner
                            intent="warning"
                            icon={WarningIcon}
                            description={
                                <Translation
                                    id="TR_APPROVAL_MODAL_REVOKE_BANNER"
                                    values={{ displaySymbol: symbolLabel }}
                                />
                            }
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
                                label="TR_APPROVAL_LIMIT"
                                networkSymbol={account.symbol}
                                contractAddress={token.contract}
                                symbol={token.symbol}
                                decimals={token.decimals}
                                amount={currentLimit}
                                isRevoked
                            />
                        )}
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
