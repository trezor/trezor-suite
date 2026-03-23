import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import {
    TxSimulationBanner,
    TxSimulationProvider,
    TxSimulationResult,
    TxSimulationTitle,
} from '@suite/tx-simulation';
import { getSimulationErrorRiskLevel, useTxSimulation } from '@suite-common/tx-simulation';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { Column, Modal, Spinner } from '@trezor/components';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Fees } from 'src/components/wallet/Fees/Fees';

import { TxSimulationContractInfo } from './components/TxSimulationContractInfo';
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

    const { txSimulationQuery, network, targetContract } = useTxSimulation(action, {
        onSuccess({ simulation, gas_estimation }) {
            // Use TX simulation gas estimation instead of the default if available
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
        },
    });
    // Show only after simulation is loaded
    const composedLevelsFiltered = txSimulationQuery.isLoading ? null : composedLevels;

    const { confirm, cancel } = useTxSimulationActions({
        method: action.method,
        form,
        feeInfo,
    });

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
                            (txSimulationQuery.data?.needsDisclaimer && !disclaimerAccepted),
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
                                {txSimulationQuery.data.simulation?.status === 'Success' && (
                                    <>
                                        <TxSimulationResult
                                            accountSummary={
                                                txSimulationQuery.data.simulation.account_summary
                                            }
                                            network={network}
                                        />
                                        {targetContract && (
                                            <TxSimulationContractInfo
                                                targetContract={targetContract}
                                                simulation={txSimulationQuery.data.simulation}
                                                network={network}
                                            />
                                        )}
                                    </>
                                )}

                                {txSimulationQuery.data.validation?.result_type === 'Malicious' && (
                                    <TxSimulationBanner
                                        type="error"
                                        title="TR_SIMULATION_MALICIOUS"
                                        description={txSimulationQuery.data.validation?.description}
                                        disclaimerAccepted={disclaimerAccepted}
                                        setDisclaimerAccepted={setDisclaimerAccepted}
                                    />
                                )}

                                {txSimulationQuery.data.validation?.result_type === 'Warning' && (
                                    <TxSimulationBanner
                                        type="warning"
                                        title="TR_SIMULATION_WARNING"
                                        description={txSimulationQuery.data.validation?.description}
                                        disclaimerAccepted={disclaimerAccepted}
                                        setDisclaimerAccepted={setDisclaimerAccepted}
                                    />
                                )}

                                {txSimulationQuery.data.simulation?.status === 'Error' && (
                                    <TxSimulationBanner
                                        type={getSimulationErrorRiskLevel(
                                            txSimulationQuery.data.simulation.error,
                                        )}
                                        title="TR_SIMULATION_ERROR"
                                        description={txSimulationQuery.data.simulation.error}
                                        disclaimerAccepted={disclaimerAccepted}
                                        setDisclaimerAccepted={setDisclaimerAccepted}
                                    />
                                )}
                            </>
                        )}

                        {txSimulationQuery.error && (
                            <TxSimulationBanner
                                type="error"
                                title="TR_SIMULATION_ERROR"
                                description={txSimulationQuery.error.message}
                                disclaimerAccepted={disclaimerAccepted}
                                setDisclaimerAccepted={setDisclaimerAccepted}
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
