import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import {
    TxSimulationError,
    TxSimulationFooter,
    TxSimulationLoader,
    TxSimulationProvider,
    TxSimulationTitle,
} from '@suite/tx-simulation/src/common';
import { EvmInsufficientGasWarning, EvmTxSimulationDisclaimer } from '@suite/tx-simulation/src/evm';
import { connectPopupActions } from '@suite-common/connect-popup';
import {
    TX_METHODS_WITH_FEES,
    areTxSimulationMethods,
    isTxSimulationResultWithMethods,
    useTxSimulation,
} from '@suite-common/tx-simulation';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { Column, Modal } from '@trezor/components';
import { ERRORS } from '@trezor/connect-common';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch } from 'src/hooks/suite';

import { TxSimulationHeader } from '../common/components/TxSimulationHeader';
import { TxSimulationSuccessResult } from '../common/components/TxSimulationSuccessResult';
import { useEvmTxSimulationFeesForm } from '../common/hooks/useEvmTxSimulationFeesForm';

interface ConnectPopupTxSimulationModalInnerProps {
    action: TxSimulationAction;
    account: Account;
}

export function ConnectPopupTxSimulationModalInner({
    action,
    account,
}: ConnectPopupTxSimulationModalInnerProps) {
    const dispatch = useDispatch();
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    const {
        form,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        handleTxSimulationResult,
        getSelectedFee,
    } = useEvmTxSimulationFeesForm({
        networkType: account.networkType,
        networkSymbol: account.symbol,
        defaultGasLimit: areTxSimulationMethods(TX_METHODS_WITH_FEES, action)
            ? action.payload.transaction.gasLimit
            : undefined,
    });

    const selectedFeeLevel = form.watch('selectedFee') || 'normal';
    const currentComposedLevel = composedLevels?.[selectedFeeLevel];

    const simulation = useTxSimulation(action, {
        onSuccess(result) {
            if (isTxSimulationResultWithMethods(TX_METHODS_WITH_FEES, result)) {
                handleTxSimulationResult(result.payload);
            }
        },
    });

    if (!simulation) return null;

    const { txSimulationQuery, network, targetContract } = simulation;

    if (
        !areTxSimulationMethods(
            ['ethereumSignTransaction', 'ethereumSignTypedData'] as const,
            action,
        )
    ) {
        return null;
    }

    function confirm() {
        const selectedFee = getSelectedFee();

        if (areTxSimulationMethods(TX_METHODS_WITH_FEES, action) && selectedFee) {
            dispatch(
                connectPopupActions.setSelectedFee({
                    selectedFee:
                        selectedFee.type === 'eip1559'
                            ? {
                                  maxFeePerGas: selectedFee.maxFeePerGas,
                                  maxPriorityFeePerGas: selectedFee.maxPriorityFeePerGas,
                                  gasLimit: selectedFee.gasLimit,
                                  gasPrice: undefined,
                              }
                            : {
                                  gasPrice: selectedFee.gasPrice,
                                  gasLimit: selectedFee.gasLimit,
                                  maxFeePerGas: undefined,
                                  maxPriorityFeePerGas: undefined,
                              },
                }),
            );
        }

        dispatch(connectPopupActions.approvePermissions());
    }

    function cancel() {
        dispatch(connectPopupActions.rejectPermissions(ERRORS.TypedError('Method_Cancel')));
    }

    const isConfirmDisabled = Boolean(
        txSimulationQuery.isLoading ||
        (txSimulationQuery.data?.payload?.needsDisclaimer && !disclaimerAccepted),
    );

    return (
        <ConnectModalBackdrop canSwitchDevice>
            <Modal.ModalBase
                width={600}
                heading={<TxSimulationTitle method={action.method} />}
                description={
                    <TxSimulationHeader account={account}>
                        <ConnectCallSource />
                    </TxSimulationHeader>
                }
                bottomContent={
                    <TxSimulationFooter
                        onConfirm={confirm}
                        onCancel={cancel}
                        isConfirmDisabled={isConfirmDisabled}
                    />
                }
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <Column gap={8}>
                    <TxSimulationError error={txSimulationQuery.error?.message}>
                        <TxSimulationLoader isLoading={txSimulationQuery.isLoading}>
                            {txSimulationQuery.isSuccess && (
                                <>
                                    <TxSimulationSuccessResult
                                        result={txSimulationQuery.data}
                                        network={network}
                                        targetContract={targetContract}
                                    />
                                    <EvmTxSimulationDisclaimer
                                        result={txSimulationQuery.data.payload}
                                        isAccepted={disclaimerAccepted}
                                        onChange={setDisclaimerAccepted}
                                    />
                                </>
                            )}
                        </TxSimulationLoader>
                    </TxSimulationError>

                    <Column margin={{ left: 8 }} gap={16}>
                        <TxSimulationProvider />

                        {areTxSimulationMethods(TX_METHODS_WITH_FEES, action) && (
                            <FormProvider {...form}>
                                <Fees
                                    account={account}
                                    feeInfo={feeInfo}
                                    changeFeeLevel={changeFeeLevel}
                                    composedLevels={
                                        txSimulationQuery.isSuccess ? composedLevels : null
                                    }
                                />
                            </FormProvider>
                        )}

                        <EvmInsufficientGasWarning
                            composedLevel={currentComposedLevel}
                            accountBalance={account.balance}
                            networkSymbol={account.symbol}
                        />
                    </Column>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
}
