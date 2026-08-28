import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { type UserContextModalType } from '@suite/modal';
import {
    TxSimulationError,
    TxSimulationFooter,
    TxSimulationLoader,
    TxSimulationProvider,
    TxSimulationTitle,
} from '@suite/tx-simulation/src/common';
import {
    TX_METHODS_WITH_FEES,
    areTxSimulationMethods,
    getTxSimulationDisclaimerKey,
    isTxSimulationResultWithMethods,
    useTxSimulation,
} from '@suite-common/tx-simulation';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { Banner, Card, Column, Modal } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { Fees } from 'src/components/wallet/Fees/Fees';

import { TxSimulationDisclaimer } from '../common/components/TxSimulationDisclaimer';
import { TxSimulationErrorBoundary } from '../common/components/TxSimulationErrorBoundary';
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
    const [acceptedDisclaimerKey, setAcceptedDisclaimerKey] = useState<string | null>(null);
    const [hasRenderFailure, setHasRenderFailure] = useState(false);
    const [renderFailureAccepted, setRenderFailureAccepted] = useState(false);

    const {
        form,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        composedLevelsError,
        handleTxSimulationResult,
        getSelectedFee,
    } = useEvmTxSimulationFeesForm({
        networkType: account.networkType,
        networkSymbol: account.symbol,
        defaultGasLimit: areTxSimulationMethods(TX_METHODS_WITH_FEES, action)
            ? action.payload.transaction.gasLimit
            : undefined,
        accountBalance: account.availableBalance,
        // A wrap is payable, so its value competes with the fee for the same native balance.
        txValue: areTxSimulationMethods(TX_METHODS_WITH_FEES, action)
            ? new BigNumber(action.payload.transaction.value || 0).toFixed(0)
            : undefined,
    });

    const [confirming, setConfirming] = useState<boolean>(false);

    const simulation = useTxSimulation(action, {
        onSuccess(result) {
            if (isTxSimulationResultWithMethods(TX_METHODS_WITH_FEES, result)) {
                handleTxSimulationResult(result.payload);
            }
        },
    });

    if (!simulation) return null;

    const { txSimulationQuery, network, targetContract } = simulation;

    // Acceptance is tracked by what was accepted, not by a bare flag: a refetch that starts warning
    // about something else invalidates it and the user has to acknowledge the new reason.
    const disclaimerKey = getTxSimulationDisclaimerKey(txSimulationQuery.data);
    const disclaimerAccepted = disclaimerKey !== null && disclaimerKey === acceptedDisclaimerKey;

    function acceptDisclaimer(isAccepted: boolean) {
        setAcceptedDisclaimerKey(isAccepted ? disclaimerKey : null);
    }

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
        decision.resolve({
            value: false,
        });
    }

    function confirm() {
        setConfirming(true);

        const selectedFee = areTxSimulationMethods(TX_METHODS_WITH_FEES, action)
            ? getSelectedFee()
            : null;

        const confirmingPromise = new Promise<void>(resolve => {
            decision.resolve({
                value: true,
                selectedFee,
                resolve,
            });
        });

        confirmingPromise.finally(() => {
            setConfirming(false);
        });
    }

    const isConfirmDisabled = Boolean(
        txSimulationQuery.isLoading ||
        (txSimulationQuery.data?.payload?.needsDisclaimer && !disclaimerAccepted) ||
        (hasRenderFailure && !renderFailureAccepted) ||
        composedLevelsError,
    );

    return (
        <Modal.Backdrop onClick={cancel}>
            <Modal.ModalBase
                width={600}
                heading={<TxSimulationTitle method={action.method} />}
                description={<TxSimulationHeader account={account} />}
                bottomContent={
                    <TxSimulationFooter
                        onConfirm={confirm}
                        onCancel={cancel}
                        isConfirmDisabled={isConfirmDisabled}
                        isConfirmLoading={confirming}
                    />
                }
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <Column gap={8}>
                    <TxSimulationError error={txSimulationQuery.error?.message}>
                        <TxSimulationLoader isLoading={txSimulationQuery.isLoading}>
                            {txSimulationQuery.isSuccess && (
                                <TxSimulationErrorBoundary
                                    isAccepted={renderFailureAccepted}
                                    onChange={setRenderFailureAccepted}
                                    onError={setHasRenderFailure}
                                    resetKey={txSimulationQuery.data}
                                >
                                    <TxSimulationSuccessResult
                                        result={txSimulationQuery.data}
                                        network={network}
                                        targetContract={targetContract}
                                    />
                                    <TxSimulationDisclaimer
                                        result={txSimulationQuery.data}
                                        isAccepted={disclaimerAccepted}
                                        onChange={acceptDisclaimer}
                                    />
                                </TxSimulationErrorBoundary>
                            )}
                        </TxSimulationLoader>
                    </TxSimulationError>

                    <Column margin={{ left: 8 }} gap={16}>
                        <TxSimulationProvider />

                        {areTxSimulationMethods(TX_METHODS_WITH_FEES, action) && (
                            <FormProvider {...form}>
                                <Card>
                                    <Fees
                                        account={account}
                                        feeInfo={feeInfo}
                                        changeFeeLevel={changeFeeLevel}
                                        composedLevels={
                                            txSimulationQuery.isSuccess ? composedLevels : null
                                        }
                                    />
                                </Card>
                            </FormProvider>
                        )}

                        {composedLevelsError && (
                            <Banner
                                intent="critical"
                                icon={WarningIcon}
                                description={
                                    <Translation
                                        id={composedLevelsError.id}
                                        values={composedLevelsError.values}
                                    />
                                }
                            />
                        )}
                    </Column>
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
}
