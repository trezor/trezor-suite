import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { numberToHex, toWei } from 'web3-utils';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { useFormatters } from '@suite-common/formatters';
import {
    AssetDiff,
    AssetExposure,
    getSimulationErrorRiskLevel,
    useTxSimulationConnectPopup,
} from '@suite-common/tx-simulation';
import { Network, getExplorerUrl } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectDeviceAccounts, selectExplorer } from '@suite-common/wallet-core';
import { FormState, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import {
    Banner,
    Card,
    Checkbox,
    CollapsibleBox,
    Column,
    H4,
    IconCircle,
    Link,
    Modal,
    Row,
    Spinner,
    Text,
} from '@trezor/components';
import { ERRORS } from '@trezor/connect';
import { AssetLogo, CoinLogo, isCoinSymbol } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { Address } from 'src/components/suite/Address';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Translation } from 'src/components/suite/Translation';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useExternalLink, useSelector } from 'src/hooks/suite';
import { useFees } from 'src/hooks/wallet/form/useFees';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { getTokenAddressTranslationId } from 'src/utils/wallet/tokenUtils';

const TxSimulationAsset = ({
    assetDiff,
    assetExposure,
    network,
}: {
    assetDiff?: AssetDiff;
    assetExposure?: AssetExposure;
    network: Network;
}) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const AssetIcon = () => {
        const asset = (assetDiff || assetExposure)?.asset;
        const assetType = (assetDiff || assetExposure)?.asset_type;
        const coinSymbol = asset?.symbol?.toLowerCase();
        if (assetType === 'NATIVE' && coinSymbol && isCoinSymbol(coinSymbol)) {
            return <CoinLogo symbol={coinSymbol} size={32} />;
        }
        if (asset?.symbol && 'address' in asset && network.coingeckoId) {
            return (
                <AssetLogo
                    coingeckoId={network.coingeckoId}
                    symbol={network.symbol}
                    contractAddress={asset.address}
                    size={32}
                    shouldTryToFetch={true}
                    placeholder={asset.name ?? asset.symbol}
                    placeholderWithTooltip={true}
                />
            );
        }

        return <IconCircle name="coins" size={32} variant="tertiary" hasBorder={false} />;
    };

    const getSummary = (amount: AssetDiff['in'][number]) => {
        if (amount.summary) {
            return amount.summary;
        }
        if (assetDiff?.asset_type === 'NATIVE' && 'value' in amount) {
            return `${amount.value} ${assetDiff.asset.symbol}`;
        }
        if (assetDiff?.asset && 'address' in assetDiff.asset) {
            return `${assetDiff?.asset.type} ${assetDiff.asset.address}`;
        }
    };

    return (
        <Row columnGap={spacings.xs} padding={{ horizontal: spacings.md, vertical: spacings.sm }}>
            <AssetIcon />

            {assetDiff?.in.map((inAmount, inIndex) => (
                <>
                    <Text
                        key={`in-${inIndex}`}
                        variant="primary"
                        data-testid={`@sign-message-modal/tx-simulation-in-${inIndex}`}
                        flex="1"
                    >
                        {getSummary(inAmount)}
                    </Text>
                    {inAmount.usd_price && (
                        <Text variant="tertiary" key={`in-usd-${inIndex}`}>
                            {`+ `}
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(inAmount.usd_price))}
                                currency="USD"
                            />
                        </Text>
                    )}
                </>
            ))}
            {assetDiff?.out.map((outAmount, outIndex) => (
                <>
                    <Text
                        key={`out-${outIndex}`}
                        variant="destructive"
                        data-testid={`@sign-message-modal/tx-simulation-out-${outIndex}`}
                        flex="1"
                    >
                        {getSummary(outAmount)}
                    </Text>
                    {outAmount.usd_price && (
                        <Text variant="tertiary" key={`out-usd-${outIndex}`}>
                            {`- `}
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(outAmount.usd_price))}
                                currency="USD"
                            />
                        </Text>
                    )}
                </>
            ))}
            {assetExposure?.spenders &&
                Object.values(assetExposure.spenders).map((spender, index) => (
                    <>
                        <Text
                            key={`spender-${index}`}
                            variant="tertiary"
                            data-testid={`@sign-message-modal/tx-simulation-spender-${index}`}
                        >
                            {getSummary(spender)}
                        </Text>
                        {spender.exposure.usd_price && (
                            <Text variant="tertiary" key={`spender-usd-${index}`}>
                                <BaseCurrencyAmountFormatter
                                    value={spender.exposure.usd_price}
                                    currency="USD"
                                />
                            </Text>
                        )}
                    </>
                ))}
        </Row>
    );
};

export const TxSimulationBanner = ({
    title,
    description,
    type = 'error',
    disclaimerAccepted,
    setDisclaimerAccepted,
}: {
    title: React.ReactNode;
    description: React.ReactNode;
    type: 'error' | 'warning';
    disclaimerAccepted: boolean;
    setDisclaimerAccepted: (value: boolean) => void;
}) => (
    <Banner
        intent={type === 'warning' ? 'warning' : 'critical'}
        data-testid="@tx-simulation-modal/error-banner"
    >
        <Column width="100%" padding={{ vertical: spacings.xxs }}>
            <Text typographyStyle="callout">{title}</Text>
            <Text>{description}</Text>

            <Card margin={{ top: spacings.sm }} paddingType="small">
                <Checkbox
                    data-testid="@tx-simulation-modal/disclaimer-checkbox"
                    isChecked={disclaimerAccepted}
                    onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                    verticalAlignment="center"
                >
                    <Text variant="default" typographyStyle="hint">
                        <Translation id="TR_SIMULATION_DISCLAIMER_OVERRIDE" />
                    </Text>
                </Checkbox>
            </Card>
        </Column>
    </Banner>
);

export const TxSimulationModal = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const accounts = useSelector(selectDeviceAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const account = accounts.find(
        a => popupCall?.state === 'tx-simulation' && a.key === popupCall?.selectedAccountKey,
    );
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const { isLoading, simulationResult, error, needsDisclaimer, network, targetContract } =
        useTxSimulationConnectPopup(popupCall);
    const explorer = useSelector(state => selectExplorer(state, network?.symbol));
    const explorerLink = useExternalLink(
        `${getExplorerUrl(explorer, 'address')}${targetContract}${explorer?.queryString ?? ''}`,
    );
    const defaultGasLimit =
        (popupCall?.state === 'tx-simulation' && popupCall.payload?.transaction?.gasLimit) ||
        ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;

    const methods = useForm<FormState>({
        defaultValues: {
            feeLimit: defaultGasLimit,
            estimatedFeeLimit: defaultGasLimit,
            outputs: [],
        },
    });
    const fees = useSelector(state => state.wallet.fees);
    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account?.networkType ?? 'ethereum',
        feeInfo: fees[account?.symbol ?? 'eth']?.data,
    });
    const { changeFeeLevel } = useFees({
        ...methods,
        defaultValue: 'normal',
        feeInfo,
        composeRequest: () => {},
    });
    const { setValue } = methods;
    const isSigningTransaction =
        popupCall?.state === 'tx-simulation' && popupCall?.method === 'ethereumSignTransaction';

    useEffect(() => {
        // Use TX simulation gas estimation instead of the default
        if (
            simulationResult?.gas_estimation?.status === 'Success' &&
            defaultGasLimit === ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT
        ) {
            const newFeeLimit = Number(simulationResult.gas_estimation.estimate).toString();
            setValue('feeLimit', newFeeLimit);
            setValue('estimatedFeeLimit', newFeeLimit);
        }
    }, [simulationResult, defaultGasLimit, setValue]);

    const onConfirm = () => {
        if (isSigningTransaction) {
            const values = methods.getValues();
            const selectedFeeInfo = feeInfo.levels.find(
                level => level.label === (values.selectedFee ?? 'normal'),
            );
            const maxFeePerGas = values.maxFeePerGas ?? selectedFeeInfo?.maxFeePerGas;
            const maxPriorityFeePerGas =
                values.maxPriorityFeePerGas ?? selectedFeeInfo?.maxPriorityFeePerGas;
            const gasPrice = values.feePerUnit ?? selectedFeeInfo?.feePerUnit;
            if (maxFeePerGas && maxPriorityFeePerGas) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit: numberToHex(values.feeLimit),
                            gasPrice: undefined,
                            maxFeePerGas: numberToHex(toWei(maxFeePerGas, 'gwei')),
                            maxPriorityFeePerGas: numberToHex(toWei(maxPriorityFeePerGas, 'gwei')),
                        },
                    }),
                );
            } else if (gasPrice) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit: numberToHex(values.feeLimit),
                            gasPrice: numberToHex(toWei(gasPrice, 'gwei')),
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

    return (
        <ConnectModalBackdrop canSwitchDevice>
            <Modal.ModalBase
                width={600}
                heading={
                    popupCall?.state === 'tx-simulation' &&
                    popupCall?.method === 'ethereumSignTypedData' ? (
                        <Translation id="TR_SIGN_EIP712_TYPED_DATA" />
                    ) : (
                        <Translation id="TR_REVIEW_TRANSACTION" />
                    )
                }
                description={
                    <Row
                        columnGap={spacings.md}
                        rowGap={spacings.xxs}
                        flexWrap="wrap"
                        margin={{ top: spacings.xs }}
                    >
                        {account && (
                            <Row gap={spacings.xxs}>
                                <CoinLogo size={14} symbol={account.symbol} />
                                <AccountLabel
                                    account={{
                                        ...account,
                                        accountLabel:
                                            accountLabels[account.key] || account.accountLabel,
                                    }}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                />
                            </Row>
                        )}
                        <ConnectCallSource />
                    </Row>
                }
                bottomContent={
                    <>
                        <Modal.Button
                            onClick={onConfirm}
                            data-testid="@tx-simulation-modal/confirm-button"
                            isDisabled={isLoading || (needsDisclaimer && !disclaimerAccepted)}
                        >
                            <Translation id="TR_CONFIRM" />
                        </Modal.Button>
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={onCancel}
                            data-testid="@tx-simulation-modal/cancel-button"
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <FormProvider {...methods}>
                    <Column gap={spacings.xs}>
                        {isLoading && <Spinner size={50} />}

                        {simulationResult && (
                            <>
                                {simulationResult.simulation?.status === 'Success' && (
                                    <>
                                        <Card
                                            header={
                                                <H4
                                                    margin={{ left: spacings.xxs }}
                                                    typographyStyle="callout"
                                                >
                                                    <Translation id="TR_SIMULATION" />
                                                </H4>
                                            }
                                            paddingType="small"
                                        >
                                            <Column
                                                margin={{
                                                    // @ts-expect-error - negative margins to align with card
                                                    horizontal: -spacings.md,
                                                    // @ts-expect-error - negative margins to align with card
                                                    vertical: -spacings.sm,
                                                }}
                                                hasDivider
                                            >
                                                {simulationResult.simulation.account_summary.assets_diffs.map(
                                                    (assetDiff, index) => (
                                                        <TxSimulationAsset
                                                            key={index}
                                                            assetDiff={assetDiff}
                                                            network={network}
                                                        />
                                                    ),
                                                )}
                                                {simulationResult.simulation.account_summary.exposures.map(
                                                    (assetExposure, index) => (
                                                        <TxSimulationAsset
                                                            key={index}
                                                            assetExposure={assetExposure}
                                                            network={network}
                                                        />
                                                    ),
                                                )}
                                                {simulationResult.simulation.account_summary
                                                    .assets_diffs.length === 0 &&
                                                    simulationResult.simulation.account_summary
                                                        .exposures.length === 0 && (
                                                        <Row
                                                            padding={{
                                                                horizontal: spacings.md,
                                                                vertical: spacings.sm,
                                                            }}
                                                            justifyContent="center"
                                                        >
                                                            <Text variant="tertiary">
                                                                <Translation id="TR_SIMULATION_NO_ASSETS" />
                                                            </Text>
                                                        </Row>
                                                    )}
                                            </Column>
                                        </Card>

                                        <CollapsibleBox
                                            heading={
                                                <Row
                                                    gap={spacings.xs}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    flex="1"
                                                >
                                                    <H4 typographyStyle="callout" flex="1">
                                                        <Translation id="TR_CONTRACT_INFO" />
                                                    </H4>
                                                </Row>
                                            }
                                        >
                                            {targetContract && (
                                                <Column
                                                    hasDivider
                                                    margin={{
                                                        // @ts-expect-error - negative margins to align with collapsible box
                                                        horizontal: -spacings.md,
                                                        // @ts-expect-error - negative margins to align with collapsible box
                                                        vertical: -spacings.lg,
                                                    }}
                                                >
                                                    {[
                                                        {
                                                            label: <Translation id="TR_PROTOCOL" />,
                                                            value: Object.entries(
                                                                simulationResult.simulation
                                                                    .address_details,
                                                            ).find(
                                                                ([address]) =>
                                                                    address.toLowerCase() ===
                                                                    targetContract.toLowerCase(),
                                                            )?.[1]?.name_tag,
                                                        },
                                                        {
                                                            label: (
                                                                <Translation
                                                                    id={getTokenAddressTranslationId(
                                                                        network.networkType,
                                                                    )}
                                                                />
                                                            ),
                                                            value: (
                                                                <Link href={explorerLink}>
                                                                    <Address
                                                                        value={targetContract}
                                                                        isTruncated
                                                                        isCopyAllowed
                                                                        typographyStyle="label"
                                                                    />
                                                                </Link>
                                                            ),
                                                        },
                                                        {
                                                            label: (
                                                                <Translation id="TR_CONTRACT_FUNCTION" />
                                                            ),
                                                            value: simulationResult.simulation
                                                                .params?.calldata
                                                                ?.function_signature,
                                                        },
                                                    ].map((item, index) =>
                                                        item.value ? (
                                                            <Row
                                                                key={index}
                                                                gap={spacings.xs}
                                                                padding={{
                                                                    horizontal: spacings.md,
                                                                    vertical: spacings.sm,
                                                                }}
                                                                alignItems="center"
                                                                justifyContent="flex-start"
                                                            >
                                                                <Text flex="1">{item.label}</Text>
                                                                <Text
                                                                    flex="2"
                                                                    wordBreak="break-all"
                                                                    typographyStyle="label"
                                                                >
                                                                    {item.value}
                                                                </Text>
                                                            </Row>
                                                        ) : null,
                                                    )}
                                                </Column>
                                            )}
                                        </CollapsibleBox>
                                    </>
                                )}

                                {simulationResult.validation?.result_type === 'Malicious' && (
                                    <TxSimulationBanner
                                        type="error"
                                        title={<Translation id="TR_SIMULATION_MALICIOUS" />}
                                        description={simulationResult.validation?.description}
                                        disclaimerAccepted={disclaimerAccepted}
                                        setDisclaimerAccepted={setDisclaimerAccepted}
                                    />
                                )}

                                {simulationResult.validation?.result_type === 'Warning' && (
                                    <TxSimulationBanner
                                        type="warning"
                                        title={<Translation id="TR_SIMULATION_WARNING" />}
                                        description={simulationResult.validation?.description}
                                        disclaimerAccepted={disclaimerAccepted}
                                        setDisclaimerAccepted={setDisclaimerAccepted}
                                    />
                                )}

                                {simulationResult.simulation?.status === 'Error' && (
                                    <TxSimulationBanner
                                        type={getSimulationErrorRiskLevel(
                                            simulationResult.simulation.error,
                                        )}
                                        title={<Translation id="TR_SIMULATION_ERROR" />}
                                        description={simulationResult.simulation.error}
                                        disclaimerAccepted={disclaimerAccepted}
                                        setDisclaimerAccepted={setDisclaimerAccepted}
                                    />
                                )}
                            </>
                        )}

                        {error && (
                            <TxSimulationBanner
                                type="error"
                                title={<Translation id="TR_SIMULATION_ERROR" />}
                                description={error.message}
                                disclaimerAccepted={disclaimerAccepted}
                                setDisclaimerAccepted={setDisclaimerAccepted}
                            />
                        )}

                        <Column margin={{ left: spacings.xs }} gap={spacings.md}>
                            <Text variant="tertiary">
                                <Translation
                                    id="TR_SIMULATION_POWERED_BY"
                                    values={{
                                        provider: <Link href="https://blockaid.io">Blockaid</Link>,
                                    }}
                                />
                            </Text>

                            {isSigningTransaction && account && (
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
