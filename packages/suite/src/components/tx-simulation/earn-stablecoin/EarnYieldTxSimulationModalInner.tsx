import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { type UserContextModalType } from '@suite/modal';
import {
    TxSimulationError,
    TxSimulationFooter,
    TxSimulationLoader,
    TxSimulationProvider,
    TxSimulationTitle,
} from '@suite/tx-simulation/src/common';
import { EvmTxSimulationDisclaimer } from '@suite/tx-simulation/src/evm';
import {
    TX_METHODS_WITH_FEES,
    areTxSimulationMethods,
    isTxSimulationResultWithMethods,
    useTxSimulation,
} from '@suite-common/tx-simulation';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { Column, Modal } from '@trezor/components';

import { Fees } from 'src/components/wallet/Fees/Fees';

import { TxSimulationHeader } from '../common/components/TxSimulationHeader';
import { TxSimulationSuccessResult } from '../common/components/TxSimulationSuccessResult';
import { useEvmTxSimulationFeesForm } from '../common/hooks/useEvmTxSimulationFeesForm';

interface EarnYieldTxSimulationModalInnerProps {
    action: TxSimulationAction;
    account: Account;
    decision: UserContextModalType<'earn-yield-tx-simulation'>['decision'];
    closeModal: () => void;
}

export function EarnYieldTxSimulationModalInner({
    action,
    account,
    decision,
    closeModal,
}: EarnYieldTxSimulationModalInnerProps) {
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    const { form, changeFeeLevel, feeInfo, composedLevels, handleTxSimulationResult } =
        useEvmTxSimulationFeesForm({
            networkType: account.networkType,
            networkSymbol: account.symbol,
            defaultGasLimit: areTxSimulationMethods(TX_METHODS_WITH_FEES, action)
                ? action.payload.transaction.gasLimit
                : undefined,
        });

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

    function cancel() {
        closeModal();
        decision.resolve(false);
    }

    return (
        <Modal.Backdrop onClick={cancel}>
            <Modal.ModalBase
                width={600}
                heading={<TxSimulationTitle method={action.method} />}
                description={<TxSimulationHeader account={account} />}
                bottomContent={
                    <TxSimulationFooter
                        onConfirm={() => {
                            if (areTxSimulationMethods(TX_METHODS_WITH_FEES, action)) {
                                // TODO:
                                // getSelectedFee()
                            }

                            closeModal();
                            decision.resolve(true);
                        }}
                        onCancel={cancel}
                        isConfirmDisabled={Boolean(
                            txSimulationQuery.isLoading ||
                            (txSimulationQuery.data?.payload?.needsDisclaimer &&
                                !disclaimerAccepted),
                        )}
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
                    </Column>
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
}
