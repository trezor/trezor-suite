import { type ReactNode, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import {
    type NetworkTxSimulationResult,
    getTxSimulationRiskSummary,
    isTxSimulationResultWithMethods,
    useTxSimulation,
} from '@suite-common/tx-simulation';
import { type TxSimulationAction } from '@suite-common/wallet-types';
import { BannerFull, Button, Card, HStack, Loader, VStack } from '@suite-native/atoms';
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
import { EvmTxSimulationStackedInfoItems } from './EvmTxSimulationStackedInfoItems';
import { TxSimulationAssetRows } from './TxSimulationAssetRows';
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
            <BannerFull
                intent="critical"
                title={<Translation id="moduleConnectPopup.simulation.simulationStatusError" />}
            />
        );
    }

    const { txSimulationQuery, network, targetContract } = simulation;
    const simulationData = txSimulationQuery.data ?? null;
    const evmSimulationData = isTxSimulationResultWithMethods(
        ['ethereumSignTypedData', 'ethereumSignTransaction'] as const,
        simulationData,
    )
        ? simulationData
        : null;
    const evmSimulation = evmSimulationData?.payload.simulation;
    const solanaAssetDiffs = isTxSimulationResultWithMethods(
        ['solanaSignTransaction'] as const,
        simulationData,
    )
        ? simulationData.payload.result?.simulation?.account_summary.account_assets_diff
        : undefined;
    const stellarResult = isTxSimulationResultWithMethods(
        ['stellarSignTransaction'] as const,
        simulationData,
    )
        ? simulationData.payload
        : undefined;
    const stellarAssetDiffs =
        stellarResult?.simulation?.status === 'Success'
            ? stellarResult.simulation.account_summary.account_assets_diffs
            : undefined;
    const { validationRisk, simulationFailure } = getTxSimulationRiskSummary(
        simulationData ?? undefined,
    );
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
                                <TxSimulationAssetRows
                                    result={simulationData}
                                    network={network}
                                    areAssetDividersDisplayed={areAssetDividersDisplayed}
                                    assetVariant={assetVariant}
                                />

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

                    {solanaAssetDiffs && (
                        <VStack>
                            {title}
                            <Card noPadding>
                                <TxSimulationAssetRows
                                    result={simulationData}
                                    network={network}
                                    areAssetDividersDisplayed={areAssetDividersDisplayed}
                                    assetVariant={assetVariant}
                                />
                            </Card>
                        </VStack>
                    )}

                    {stellarAssetDiffs && (
                        <VStack>
                            {title}
                            <Card noPadding>
                                <TxSimulationAssetRows
                                    result={simulationData}
                                    network={network}
                                    areAssetDividersDisplayed={areAssetDividersDisplayed}
                                    assetVariant={assetVariant}
                                />
                            </Card>
                        </VStack>
                    )}

                    {validationRisk?.riskLevel === 'Malicious' && (
                        <TxSimulationRiskBanner
                            intent="critical"
                            title={
                                <Translation id="moduleConnectPopup.simulation.simulationStatusMalicious" />
                            }
                            description={validationRisk.description}
                            disclaimerAccepted={disclaimerAccepted}
                            setDisclaimerAccepted={setDisclaimerAccepted}
                        />
                    )}

                    {validationRisk?.riskLevel === 'Warning' && (
                        <TxSimulationRiskBanner
                            intent="warning"
                            title={
                                <Translation id="moduleConnectPopup.simulation.simulationStatusWarning" />
                            }
                            description={validationRisk.description}
                            disclaimerAccepted={disclaimerAccepted}
                            setDisclaimerAccepted={setDisclaimerAccepted}
                        />
                    )}

                    {simulationFailure && (
                        <TxSimulationRiskBanner
                            intent="critical"
                            title={
                                <Translation id="moduleConnectPopup.simulation.simulationStatusError" />
                            }
                            description={simulationFailure.error}
                            disclaimerAccepted={disclaimerAccepted}
                            setDisclaimerAccepted={setDisclaimerAccepted}
                        />
                    )}
                </>
            )}

            {txSimulationQuery.error && (
                <BannerFull
                    intent="critical"
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
