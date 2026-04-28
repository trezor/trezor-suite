import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { TxSimulationBanner, TxSimulationProvider, TxSimulationTitle } from '@suite/tx-simulation';
import { areTxSimulationMethods, useTxSimulation } from '@suite-common/tx-simulation';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { Column, Modal, Spinner } from '@trezor/components';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Fees } from 'src/components/wallet/Fees/Fees';

import { TxSimulationDisclaimer } from './TxSimulationDisclaimer';
import { TxSimulationSuccessResult } from './TxSimulationSuccessResult';
import { TxSimulationFooter } from './components/TxSimulationFooter';
import { TxSimulationHeader } from './components/TxSimulationHeader';
import { useTxFeesForm } from './hooks/useTxFeesForm';
import { useTxSimulationActions } from './hooks/useTxSimulationActions';

interface TxSimulationModalInnerProps {
    action: TxSimulationAction;
    account: Account;
}

export function TxSimulationModalInner({ action, account }: TxSimulationModalInnerProps) {
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    const { form, changeFeeLevel, feeInfo, defaultGasLimit, composedLevels } = useTxFeesForm({
        networkType: account.networkType,
        networkSymbol: account.symbol,
        defaultGasLimit:
            action.method === 'ethereumSignTransaction'
                ? action.payload.transaction.gasLimit
                : undefined,
    });

    const simulation = useTxSimulation(action, {
        onSuccess({ method, payload }) {
            switch (method) {
                case 'ethereumSignTransaction':
                case 'ethereumSignTypedData': {
                    const { simulation, gas_estimation } = payload;
                    const newFeeLimit =
                        gas_estimation?.status === 'Success'
                            ? Number(gas_estimation.estimate).toString()
                            : null;

                    if (
                        simulation?.status === 'Success' &&
                        newFeeLimit &&
                        newFeeLimit !== defaultGasLimit
                    ) {
                        form.setValue('feeLimit', newFeeLimit);
                        form.setValue('estimatedFeeLimit', newFeeLimit);
                    }

                    break;
                }
            }
        },
    });

    const { confirm, cancel } = useTxSimulationActions({
        method: action.method,
        form,
        feeInfo,
    });

    if (!simulation) return null;

    const { txSimulationQuery, network, targetContract } = simulation;
    // Show only after simulation is loaded
    const composedLevelsFiltered = txSimulationQuery.isLoading ? null : composedLevels;

    if (
        !areTxSimulationMethods(
            ['ethereumSignTransaction', 'ethereumSignTypedData'] as const,
            action.method,
        )
    ) {
        return null;
    }

    return (
        <ConnectModalBackdrop canSwitchDevice>
            <Modal.ModalBase
                width={600}
                heading={<TxSimulationTitle method={action.method} />}
                description={<TxSimulationHeader account={account} />}
                bottomContent={
                    <TxSimulationFooter
                        onConfirm={confirm}
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
                <FormProvider {...form}>
                    <Column gap={8}>
                        {txSimulationQuery.isLoading && <Spinner size={48} isDisabled={true} />}

                        {txSimulationQuery.isSuccess && (
                            <>
                                <TxSimulationSuccessResult
                                    result={txSimulationQuery.data}
                                    network={network}
                                    targetContract={targetContract}
                                />
                                <TxSimulationDisclaimer
                                    result={txSimulationQuery.data.payload}
                                    isAccepted={disclaimerAccepted}
                                    onChange={setDisclaimerAccepted}
                                />
                            </>
                        )}

                        {txSimulationQuery.error && (
                            <TxSimulationBanner
                                type="error"
                                title="TR_SIMULATION_ERROR"
                                description={txSimulationQuery.error.message}
                                isAccepted={disclaimerAccepted}
                                onChange={setDisclaimerAccepted}
                            />
                        )}

                        <Column margin={{ left: 8 }} gap={16}>
                            <TxSimulationProvider />

                            {action.method === 'ethereumSignTransaction' && (
                                <Fees
                                    account={account}
                                    feeInfo={feeInfo}
                                    changeFeeLevel={changeFeeLevel}
                                    composedLevels={composedLevelsFiltered}
                                />
                            )}
                        </Column>
                    </Column>
                </FormProvider>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
}
