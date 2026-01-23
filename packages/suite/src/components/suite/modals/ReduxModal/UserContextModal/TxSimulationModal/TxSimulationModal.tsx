import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import {
    getSimulationErrorRiskLevel,
    useTxSimulationConnectPopup,
} from '@suite-common/tx-simulation';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Column, Modal, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';

import { TxSimulationBanner } from './components/TxSimulationBanner';
import { TxSimulationContractInfo } from './components/TxSimulationContractInfo';
import { TxSimulationFooter } from './components/TxSimulationFooter';
import { TxSimulationHeader } from './components/TxSimulationHeader';
import { TxSimulationProvider } from './components/TxSimulationProvider';
import { TxSimulationResult } from './components/TxSimulationResult';
import { TxSimulationTitle } from './components/TxSimulationTitle';
import { useTxFeesForm } from './hooks/useTxFeesForm';
import { useTxSimulationActions } from './hooks/useTxSimulationActions';

export const TxSimulationModal = () => {
    const popupCall = useSelector(selectConnectPopupCall);
    const account = useSelector(state =>
        popupCall?.state === 'tx-simulation'
            ? selectAccountByKey(state, popupCall?.selectedAccountKey)
            : null,
    );
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    const { form, changeFeeLevel, feeInfo, hasDefaultGasLimit } = useTxFeesForm({
        networkType: account?.networkType,
        networkSymbol: account?.symbol,
        defaultGasLimit:
            popupCall?.state === 'tx-simulation' && popupCall.payload?.transaction?.gasLimit,
    });

    const { txSimulationQuery, network, targetContract } = useTxSimulationConnectPopup(popupCall, {
        onTxSimulationSuccess({ simulation, gas_estimation }) {
            // Use TX simulation gas estimation instead of the default if available
            if (
                simulation?.status === 'Success' &&
                gas_estimation?.status === 'Success' &&
                hasDefaultGasLimit
            ) {
                const newFeeLimit = Number(gas_estimation.estimate).toString();
                form.setValue('feeLimit', newFeeLimit);
                form.setValue('estimatedFeeLimit', newFeeLimit);
            }
        },
    });

    const isEthereumSigningTransaction =
        popupCall?.state === 'tx-simulation' && popupCall?.method === 'ethereumSignTransaction';

    const { confirm, cancel } = useTxSimulationActions({
        isEthereumSigningTransaction,
        form,
        feeInfo,
    });

    return (
        <ConnectModalBackdrop canSwitchDevice>
            <Modal.ModalBase
                width={600}
                heading={
                    <TxSimulationTitle
                        isEthereumSigningTypedData={
                            popupCall?.state === 'tx-simulation' &&
                            popupCall?.method === 'ethereumSignTypedData'
                        }
                    />
                }
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
                    <Column gap={spacings.xs}>
                        {txSimulationQuery.isLoading && <Spinner size={50} />}

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
                                        <TxSimulationContractInfo
                                            targetContract={targetContract}
                                            simulation={txSimulationQuery.data.simulation}
                                            network={network}
                                        />
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

                        <Column margin={{ left: spacings.xs }} gap={spacings.md}>
                            <TxSimulationProvider />

                            {isEthereumSigningTransaction && account && (
                                <Fees
                                    account={account}
                                    feeInfo={feeInfo}
                                    changeFeeLevel={changeFeeLevel}
                                    composedLevels={null}
                                />
                            )}
                        </Column>
                    </Column>
                </FormProvider>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
