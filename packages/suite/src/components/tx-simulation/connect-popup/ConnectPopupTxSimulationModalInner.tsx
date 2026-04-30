import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import {
    TxSimulationError,
    TxSimulationFooter,
    TxSimulationLoader,
    TxSimulationProvider,
    TxSimulationTitle,
} from '@suite/tx-simulation/src/common';
import { EvmTxSimulationDisclaimer } from '@suite/tx-simulation/src/evm';
import { connectPopupActions } from '@suite-common/connect-popup';
import { areTxSimulationMethods, useTxSimulation } from '@suite-common/tx-simulation';
import { isTxSimulationResultWithMethods } from '@suite-common/tx-simulation/src/hooks/useNetworkTxSimulation';
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

const METHODS_WITH_FEES = ['ethereumSignTransaction'] as const satisfies ReadonlyArray<
    TxSimulationAction['method']
>;

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
        defaultGasLimit: areTxSimulationMethods(METHODS_WITH_FEES, action)
            ? action.payload.transaction.gasLimit
            : undefined,
    });

    const simulation = useTxSimulation(action, {
        onSuccess(result) {
            if (isTxSimulationResultWithMethods(METHODS_WITH_FEES, result)) {
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
                        onConfirm={() => {
                            if (areTxSimulationMethods(METHODS_WITH_FEES, action)) {
                                dispatch(
                                    connectPopupActions.setSelectedFee({
                                        selectedFee: getSelectedFee(),
                                    }),
                                );
                            }

                            dispatch(connectPopupActions.approvePermissions());
                        }}
                        onCancel={() => {
                            dispatch(
                                connectPopupActions.rejectPermissions(
                                    ERRORS.TypedError('Method_Cancel'),
                                ),
                            );
                        }}
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

                        {areTxSimulationMethods(METHODS_WITH_FEES, action) && (
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
        </ConnectModalBackdrop>
    );
}
