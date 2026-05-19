import { type ReactNode, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import {
    type NetworkTxSimulationResult,
    isTxSimulationResultWithMethods,
    useTxSimulation,
} from '@suite-common/tx-simulation';
import { type TxSimulationAction } from '@suite-common/wallet-types';
import {
    Box,
    Button,
    Card,
    Divider,
    FullAlertBox,
    HStack,
    Loader,
    VStack,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';

import {
    EvmInsufficientGasWarning,
    type EvmInsufficientGasWarningProps,
} from './EvmInsufficientGasWarning';
import {
    getEvmTxSimulationContractInfoItems,
    getEvmTxSimulationFeeInfoItems,
} from './EvmTxSimulationInfoPresets';
import { EvmTxSimulationInfoSection } from './EvmTxSimulationInfoSection';
import { EvmTxSimulationRowInfoItems } from './EvmTxSimulationRowInfoItems';
import { EvmTxSimulationStackedAsset } from './EvmTxSimulationStackedAsset';
import { EvmTxSimulationStackedInfoItems } from './EvmTxSimulationStackedInfoItems';
import { EvmTxSimulationWrappedAsset } from './EvmTxSimulationWrappedAsset';
import { TxSimulationRiskBanner } from './TxSimulationRiskBanner';

type EvmTxSimulationReviewContentProps = {
    action: TxSimulationAction;
    afterSimulation?: ReactNode;
    areAssetDividersDisplayed?: boolean;
    assetVariant?: 'stack' | 'wrap';
    cancelButton?: ReactNode;
    confirmTestID?: string;
    headerContent?: ReactNode;
    insufficientGasWarning?: EvmInsufficientGasWarningProps;
    isConfirmDisabled?: boolean;
    onConfirm: () => void;
    onSuccess?: (result: NetworkTxSimulationResult) => void;
    title?: ReactNode;
};

type EvmTxSimulationInfoSectionKey = 'contract' | 'fee';

export function EvmTxSimulationReviewContent({
    action,
    afterSimulation,
    areAssetDividersDisplayed = true,
    assetVariant = 'stack',
    cancelButton,
    confirmTestID,
    headerContent,
    insufficientGasWarning,
    isConfirmDisabled = false,
    onConfirm,
    onSuccess,
    title,
}: EvmTxSimulationReviewContentProps) {
    const { CryptoAmountFormatter } = useFormatters();
    const copyToClipboard = useCopyToClipboard();
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const [expandedSection, setExpandedSection] = useState<EvmTxSimulationInfoSectionKey | null>(
        null,
    );
    const simulation = useTxSimulation(action, { onSuccess });

    const toggleExpandedSection = (section: EvmTxSimulationInfoSectionKey) => {
        setExpandedSection(currentSection => (currentSection === section ? null : section));
    };

    if (!simulation) {
        return (
            <FullAlertBox
                variant="critical"
                title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
            />
        );
    }

    const { txSimulationQuery, network, targetContract } = simulation;
    const simulationData = isTxSimulationResultWithMethods(
        ['ethereumSignTypedData', 'ethereumSignTransaction'] as const,
        txSimulationQuery.data,
    )
        ? txSimulationQuery.data
        : null;
    const evmSimulation = simulationData?.payload.simulation;
    const isConfirmButtonDisabled =
        !simulationData ||
        txSimulationQuery.isLoading ||
        !!(simulationData.payload.needsDisclaimer && !disclaimerAccepted) ||
        isConfirmDisabled;
    const contractInfoItems =
        targetContract && evmSimulation?.status === 'Success'
            ? getEvmTxSimulationContractInfoItems({
                  onCopyContractPress: () => copyToClipboard(targetContract),
                  targetContract,
                  txSimulation: evmSimulation,
              })
            : [];
    const feeInfoItems =
        action.method === 'ethereumSignTransaction'
            ? getEvmTxSimulationFeeInfoItems({
                  formatCryptoAmount: CryptoAmountFormatter.format,
                  network,
                  transaction: action.payload.transaction,
              })
            : [];
    const EvmTxSimulationAssetComponent =
        assetVariant === 'wrap' ? EvmTxSimulationWrappedAsset : EvmTxSimulationStackedAsset;

    return (
        <VStack spacing="sp16">
            {headerContent}

            {txSimulationQuery.isLoading && (
                <Card>
                    <HStack paddingVertical="sp64" justifyContent="center" alignItems="center">
                        <Loader
                            size="large"
                            title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
                            color="contentSecondary"
                        />
                    </HStack>
                </Card>
            )}

            {simulationData && (
                <>
                    {evmSimulation?.status === 'Success' && (
                        <VStack>
                            {title}
                            <Card noPadding>
                                {evmSimulation.account_summary.assets_diffs.map(
                                    (assetDiff, index) => (
                                        <Box key={`diff-${index}`}>
                                            {areAssetDividersDisplayed && index > 0 && <Divider />}
                                            <EvmTxSimulationAssetComponent
                                                assetDiff={assetDiff}
                                                network={network}
                                            />
                                        </Box>
                                    ),
                                )}
                                {evmSimulation.account_summary.exposures.map(
                                    (assetExposure, index) => (
                                        <Box key={`exposure-${index}`}>
                                            {areAssetDividersDisplayed &&
                                                (index > 0 ||
                                                    evmSimulation.account_summary.assets_diffs
                                                        .length > 0) && <Divider />}
                                            <EvmTxSimulationAssetComponent
                                                assetExposure={assetExposure}
                                                network={network}
                                            />
                                        </Box>
                                    ),
                                )}

                                {targetContract && (
                                    <EvmTxSimulationInfoSection
                                        isExpanded={expandedSection === 'contract'}
                                        onPress={() => toggleExpandedSection('contract')}
                                        title={
                                            <Translation id="moduleConnectPopup.simulation.contractInfo" />
                                        }
                                    >
                                        <EvmTxSimulationStackedInfoItems
                                            items={contractInfoItems}
                                        />
                                    </EvmTxSimulationInfoSection>
                                )}

                                {action.method === 'ethereumSignTransaction' && (
                                    <EvmTxSimulationInfoSection
                                        isExpanded={expandedSection === 'fee'}
                                        onPress={() => toggleExpandedSection('fee')}
                                        title={
                                            <Translation id="moduleConnectPopup.simulation.feeInfo" />
                                        }
                                    >
                                        <EvmTxSimulationRowInfoItems items={feeInfoItems} />
                                    </EvmTxSimulationInfoSection>
                                )}
                            </Card>
                        </VStack>
                    )}

                    {simulationData.payload.validation?.result_type === 'Malicious' && (
                        <TxSimulationRiskBanner
                            type="critical"
                            title={
                                <Translation id="moduleConnectPopup.simulation.simulationStatusMalicious" />
                            }
                            description={simulationData.payload.validation?.description}
                            disclaimerAccepted={disclaimerAccepted}
                            setDisclaimerAccepted={setDisclaimerAccepted}
                        />
                    )}

                    {simulationData.payload.validation?.result_type === 'Warning' && (
                        <TxSimulationRiskBanner
                            type="warning"
                            title={
                                <Translation id="moduleConnectPopup.simulation.simulationStatusWarning" />
                            }
                            description={simulationData.payload.validation?.description}
                            disclaimerAccepted={disclaimerAccepted}
                            setDisclaimerAccepted={setDisclaimerAccepted}
                        />
                    )}

                    {evmSimulation?.status === 'Error' && (
                        <TxSimulationRiskBanner
                            type="critical"
                            title={
                                <Translation id="moduleConnectPopup.simulation.simulationStatusError" />
                            }
                            description={evmSimulation.error}
                            disclaimerAccepted={disclaimerAccepted}
                            setDisclaimerAccepted={setDisclaimerAccepted}
                        />
                    )}
                </>
            )}

            {txSimulationQuery.error && (
                <FullAlertBox
                    variant="critical"
                    title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
                    description={txSimulationQuery.error.message}
                />
            )}

            {simulationData && afterSimulation}

            {simulationData && insufficientGasWarning && (
                <EvmInsufficientGasWarning {...insufficientGasWarning} />
            )}

            <Button testID={confirmTestID} isDisabled={isConfirmButtonDisabled} onPress={onConfirm}>
                <Translation id="generic.buttons.continue" />
            </Button>

            {cancelButton}
        </VStack>
    );
}
