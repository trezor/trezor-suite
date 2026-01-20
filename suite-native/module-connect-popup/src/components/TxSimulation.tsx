import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { useTxSimulationConnectPopup } from '@suite-common/tx-simulation';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { AccountsListItem } from '@suite-native/accounts';
import {
    Button,
    Card,
    CardDivider,
    HStack,
    Loader,
    PressableOpacity,
    Text,
    TitleHeader,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { ERRORS } from '@trezor/connect';

import { ConnectAppIcon } from './ConnectAppIcon';
import { ContractInfoBottomSheet } from './TxSimulation/ContractInfoBottomSheet';
import { FeeInfoBottomSheet } from './TxSimulation/FeeInfoBottomSheet';
import { TxSimulationAsset } from './TxSimulation/TxSimulationAsset';
import { TxSimulationBanner } from './TxSimulation/TxSimulationBanner';

export const TxSimulation = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);

    const accounts = useSelector(selectDeviceAccounts);
    const account = accounts.find(
        a => popupCall?.state === 'tx-simulation' && a.key === popupCall?.selectedAccountKey,
    );
    const { bottomSheetRef: contractInfoBottomSheetRef, openModal: openContractInfoModal } =
        useBottomSheetModal();
    const { bottomSheetRef: feeInfoBottomSheetRef, openModal: openFeeInfoModal } =
        useBottomSheetModal();
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const { txSimulationQuery, network, targetContract } = useTxSimulationConnectPopup(popupCall);

    const isSigningTransaction =
        popupCall?.state === 'tx-simulation' && popupCall?.method === 'ethereumSignTransaction';

    // Fees
    const defaultGasLimit =
        (popupCall?.state === 'tx-simulation' && popupCall.payload?.transaction?.gasLimit) ||
        ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;
    const [gasLimit, setGasLimit] = useState(defaultGasLimit);

    useEffect(() => {
        if (!txSimulationQuery.isSuccess) {
            return;
        }

        const { gas_estimation } = txSimulationQuery.data;

        // Use TX simulation gas estimation instead of the default
        if (
            gas_estimation?.status === 'Success' &&
            defaultGasLimit === ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT
        ) {
            const newFeeLimit = Number(gas_estimation.estimate).toString();
            setGasLimit(newFeeLimit);
        }
    }, [txSimulationQuery, defaultGasLimit]);

    const onConfirm = () => {
        if (isSigningTransaction) {
            // TODO add fee selection
            const maxFeePerGas = popupCall.payload?.transaction?.maxFeePerGas;
            const maxPriorityFeePerGas = popupCall.payload?.transaction?.maxPriorityFeePerGas;
            const gasPrice = popupCall.payload?.transaction?.gasPrice;
            if (maxFeePerGas && maxPriorityFeePerGas) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit,
                            gasPrice: undefined,
                            maxFeePerGas,
                            maxPriorityFeePerGas,
                        },
                    }),
                );
            } else if (gasPrice) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit,
                            gasPrice,
                            maxFeePerGas: undefined,
                            maxPriorityFeePerGas: undefined,
                        },
                    }),
                );
            }
        }
        dispatch(connectPopupActions.approvePermissions());
    };
    const onCancel = () => {
        dispatch(connectPopupActions.rejectPermissions(ERRORS.TypedError('Method_Cancel')));
    };

    if (popupCall?.state !== 'tx-simulation') return null;

    return (
        <VStack testID="@popup/tx-simulation" spacing="sp16" flex={1}>
            <TitleHeader
                title={<Translation id="moduleConnectPopup.simulation.reviewTransaction" />}
            />

            <Card noPadding>
                <HStack alignItems="center" spacing="sp16" padding="sp12">
                    <ConnectAppIcon
                        src={popupCall.source.manifest?.appIcon}
                        type="trezorConnect"
                        size="medium"
                    />
                    <VStack flex={1} spacing="sp4">
                        <Text>{popupCall.source.manifest?.appName ?? popupCall.source.origin}</Text>
                        {popupCall.source.manifest?.appName && (
                            <Text color="textSubdued">{popupCall.source.origin}</Text>
                        )}
                    </VStack>
                </HStack>
            </Card>

            {account && (
                <VStack>
                    <Text>
                        <Translation id="moduleConnectPopup.walletConnect.selectedAccount" />
                    </Text>
                    <Card noPadding>
                        <AccountsListItem account={account} />
                    </Card>
                </VStack>
            )}

            {txSimulationQuery.isLoading && (
                <Card>
                    <HStack paddingVertical="sp64" justifyContent="center" alignItems="center">
                        <Loader
                            size="large"
                            title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
                            color="textSubdued"
                        />
                    </HStack>
                </Card>
            )}

            {txSimulationQuery.data?.simulation?.status === 'Success' && (
                <VStack>
                    <Text>
                        <Translation id="moduleConnectPopup.simulation.simulation" />
                    </Text>
                    <Card noPadding>
                        <VStack spacing={0}>
                            {txSimulationQuery.data.simulation.account_summary.assets_diffs.map(
                                (assetDiff, index) => (
                                    <TxSimulationAsset
                                        key={index}
                                        assetDiff={assetDiff}
                                        network={network}
                                    />
                                ),
                            )}
                            {txSimulationQuery.data.simulation.account_summary.exposures.map(
                                (assetExposure, index) => (
                                    <TxSimulationAsset
                                        key={index}
                                        assetExposure={assetExposure}
                                        network={network}
                                    />
                                ),
                            )}
                        </VStack>

                        <CardDivider />

                        <PressableOpacity onPress={openContractInfoModal}>
                            <HStack
                                padding="sp16"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Text>
                                    <Translation id="moduleConnectPopup.simulation.contractInfo" />
                                </Text>
                                <Icon name="caretDown" size="small" color="textSubdued" />
                            </HStack>
                        </PressableOpacity>

                        {isSigningTransaction && (
                            <>
                                <CardDivider />

                                <PressableOpacity onPress={openFeeInfoModal}>
                                    <HStack
                                        padding="sp16"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Text>
                                            <Translation id="moduleConnectPopup.simulation.feeInfo" />
                                        </Text>
                                        <Icon name="caretDown" size="small" color="textSubdued" />
                                    </HStack>
                                </PressableOpacity>
                            </>
                        )}
                    </Card>
                </VStack>
            )}

            {txSimulationQuery.data?.validation?.result_type === 'Malicious' && (
                <TxSimulationBanner
                    type="error"
                    title={
                        <Translation id="moduleConnectPopup.simulation.simulationStatusMalicious" />
                    }
                    description={txSimulationQuery.data.validation?.description}
                    disclaimerAccepted={disclaimerAccepted}
                    setDisclaimerAccepted={setDisclaimerAccepted}
                />
            )}

            {txSimulationQuery.data?.validation?.result_type === 'Warning' && (
                <TxSimulationBanner
                    type="warning"
                    title={
                        <Translation id="moduleConnectPopup.simulation.simulationStatusWarning" />
                    }
                    description={txSimulationQuery.data.validation?.description}
                    disclaimerAccepted={disclaimerAccepted}
                    setDisclaimerAccepted={setDisclaimerAccepted}
                />
            )}

            {txSimulationQuery.data?.simulation?.status === 'Error' && (
                <TxSimulationBanner
                    type="error"
                    title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
                    description={txSimulationQuery.data.simulation.error}
                    disclaimerAccepted={disclaimerAccepted}
                    setDisclaimerAccepted={setDisclaimerAccepted}
                />
            )}

            {txSimulationQuery.error && (
                <TxSimulationBanner
                    type="error"
                    title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
                    description={txSimulationQuery.error.message}
                    disclaimerAccepted={disclaimerAccepted}
                    setDisclaimerAccepted={setDisclaimerAccepted}
                />
            )}

            <Text variant="hint">
                <Translation
                    id="moduleConnectPopup.simulation.simulationPoweredBy"
                    values={{ provider: 'Blockaid' }}
                />
            </Text>

            <Button
                testID="@popup/confirm-simulation"
                onPress={onConfirm}
                isDisabled={
                    txSimulationQuery.isLoading ||
                    (txSimulationQuery.data?.needsDisclaimer && !disclaimerAccepted)
                }
            >
                <Translation id="generic.buttons.continue" />
            </Button>

            <Button
                testID="@popup/cancel-simulation"
                onPress={onCancel}
                colorScheme="tertiaryElevation0"
            >
                <Translation id="generic.buttons.cancel" />
            </Button>

            <ContractInfoBottomSheet
                ref={contractInfoBottomSheetRef}
                targetContract={targetContract}
                simulationResult={txSimulationQuery.data}
            />
            <FeeInfoBottomSheet
                ref={feeInfoBottomSheetRef}
                network={network}
                popupCall={popupCall}
                defaultGasLimit={defaultGasLimit}
            />
        </VStack>
    );
};
