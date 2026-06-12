import { type MouseEventHandler, type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { Address, type SelectAddressLabelState, selectAddressLabel } from '@suite/address';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForSelectedAccount,
} from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOutputLabels,
} from '@suite-common/suite-sync';
import { type SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import { formatNetworkAmount, isSameUtxo } from '@suite-common/wallet-utils';
import {
    Checkbox,
    Column,
    GhostContainer,
    Icon,
    InfoSegments,
    Row,
    Spinner,
    Text,
    TextButton,
    Tooltip,
} from '@trezor/components';
import { type AccountUtxo, type PROTO } from '@trezor/connect';

import {
    type CoinControlActions,
    type CoinControlRenderers,
    type CoinControlViewModel,
} from '../../types';

type ResolveUtxoSpendableProps = {
    coinjoinRegisteredUtxos: AccountUtxo[];
    utxo: AccountUtxo;
};

const MINIMAL_COINBASE_CONFIRMATIONS = 100;

const resolveUtxoSpendable = ({
    coinjoinRegisteredUtxos,
    utxo,
}: ResolveUtxoSpendableProps): ReactNode | null => {
    if (utxo.coinbase === true && utxo.confirmations < MINIMAL_COINBASE_CONFIRMATIONS) {
        return (
            <Translation
                id="TR_UTXO_NOT_MATURED_COINBASE"
                values={{ confirmations: MINIMAL_COINBASE_CONFIRMATIONS }}
            />
        );
    }

    if (coinjoinRegisteredUtxos.some(registeredUtxo => isSameUtxo(registeredUtxo, utxo))) {
        return <Translation id="TR_UTXO_REGISTERED_IN_COINJOIN" />;
    }

    return null;
};

type UtxoSelectionProps = {
    account: CoinControlViewModel['account'];
    coinjoinRegisteredUtxos: AccountUtxo[];
    coinjoinUnavailableMessage?: ReactNode;
    composedInputs: PROTO.TxInputType[];
    isCoinControlEnabled: boolean;
    onShowTransactionDetail: CoinControlActions['onShowTransactionDetail'];
    renderers: CoinControlRenderers;
    selectedUtxos: AccountUtxo[];
    toggleUtxoSelection: CoinControlActions['toggleUtxoSelection'];
    transaction?: CoinControlViewModel['transactions'][number];
    utxo: AccountUtxo;
};

export const UtxoSelection = ({
    account,
    coinjoinRegisteredUtxos,
    coinjoinUnavailableMessage,
    composedInputs,
    isCoinControlEnabled,
    onShowTransactionDetail,
    renderers,
    selectedUtxos,
    toggleUtxoSelection,
    transaction,
    utxo,
}: UtxoSelectionProps) => {
    const isSuiteSyncEnabled = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
            selectIsSuiteSyncEnabled(state),
    );
    const isLegacyLabelingVisible = useSelector((state: LegacyLabelingVisibleRootState) =>
        selectIsLegacyLabelingVisible(state),
    );

    const { outputLabels } = useSelector(
        (state: Parameters<typeof selectLabelingDataForSelectedAccount>[0]) =>
            selectLabelingDataForSelectedAccount(state),
    );
    const suiteSyncOutputLabels = useSelector((state: SuiteSyncDataRootState) =>
        isSuiteSyncEnabled
            ? selectSuiteSyncOutputLabels(state, account.deviceState)
            : returnStableArrayIfEmpty<SuiteSyncOutput>(),
    );
    const { translationString } = useTranslation();

    const addressLabel = useSelector((state: SelectAddressLabelState) =>
        selectAddressLabel(state, {
            address: utxo.address,
            deviceStaticId: account.deviceState,
        }),
    );

    const isPendingTransaction = utxo.confirmations === 0;
    const isChangeAddress = utxo.path.split('/').at(-2) === '1';
    const anonymity = account.addresses?.anonymitySet?.[utxo.address];

    const isChecked = isCoinControlEnabled
        ? selectedUtxos.some(selected => isSameUtxo(selected, utxo))
        : composedInputs.some(
              input => input.prev_hash === utxo.txid && input.prev_index === utxo.vout,
          );

    const unspendableTooltip = resolveUtxoSpendable({ coinjoinRegisteredUtxos, utxo });
    const isDisabled = unspendableTooltip !== null;

    const handleCheckbox = () => toggleUtxoSelection(utxo);
    const showTransactionDetail: MouseEventHandler = event => {
        event.stopPropagation();

        if (transaction) {
            onShowTransactionDetail(transaction);
        }
    };

    const outputLabel =
        suiteSyncOutputLabels.find(
            (item: SuiteSyncOutput) =>
                item.txId === utxo.txid && item.txTargetId === `${utxo.vout}`,
        )?.label ?? (isLegacyLabelingVisible ? outputLabels?.[utxo.txid]?.[utxo.vout] : undefined);

    const baseCurrencyValue = renderers.renderBaseCurrencyValue({
        amount: formatNetworkAmount(utxo.amount, account.symbol, false),
        symbol: account.symbol,
    });

    return (
        <GhostContainer onClick={handleCheckbox} padding={12} margin={{ horizontal: -12 }} as="div">
            <Row gap={24} width="100%">
                <Tooltip content={unspendableTooltip}>
                    <Checkbox
                        isChecked={isChecked}
                        isDisabled={isDisabled}
                        onChange={handleCheckbox}
                        onClick={event => event.stopPropagation()}
                    />
                </Tooltip>
                <Column flex="1" gap={0}>
                    <Row gap={12} justifyContent="space-between">
                        <Text typographyStyle="body-md">
                            <Labeling
                                deviceStaticSessionId={account.deviceState}
                                payload={{
                                    type: 'addressLabel',
                                    entityKey: account.key,
                                    defaultValue: utxo.address,
                                    accountDescriptor: account.descriptor,
                                    networkSymbol: account.symbol,
                                }}
                                displayValue={<Address value={utxo.address} isTruncated />}
                                placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                                maxWidth={350}
                                minHeight={28}
                                gap={6}
                                leftAddon={
                                    <>
                                        {isPendingTransaction && (
                                            <Tooltip
                                                content={
                                                    <Translation id="TR_IN_PENDING_TRANSACTION" />
                                                }
                                            >
                                                <Icon
                                                    name="clock"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    size={16}
                                                />
                                            </Tooltip>
                                        )}
                                        {!!coinjoinUnavailableMessage && (
                                            <Tooltip content={coinjoinUnavailableMessage}>
                                                <Icon
                                                    name="xCircle"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    size={16}
                                                />
                                            </Tooltip>
                                        )}
                                        {isChangeAddress && (
                                            <Tooltip
                                                content={
                                                    <Translation id="TR_CHANGE_ADDRESS_TOOLTIP" />
                                                }
                                            >
                                                <Icon
                                                    name="change"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    size={16}
                                                />
                                            </Tooltip>
                                        )}
                                    </>
                                }
                            >
                                {addressLabel}
                            </Labeling>
                        </Text>
                        {renderers.renderCryptoAmount({
                            value: formatNetworkAmount(utxo.amount, account.symbol),
                            symbol: account.symbol,
                        })}
                    </Row>
                    <Row justifyContent="space-between" gap={12}>
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            gap={6}
                        >
                            {transaction ? (
                                renderers.renderTransactionTimestamp({ transaction })
                            ) : (
                                <Tooltip
                                    cursor="pointer"
                                    content={<Translation id="TR_LOADING_TRANSACTION_DETAILS" />}
                                >
                                    <Spinner size={16} isDisabled={true} />
                                </Tooltip>
                            )}
                            {!!anonymity && renderers.renderUtxoAnonymity({ anonymity })}
                            {transaction && (
                                <TextButton
                                    size="small"
                                    intent="neutral"
                                    onClick={showTransactionDetail}
                                    isUnderlined
                                >
                                    <Translation id="TR_DETAIL" />
                                </TextButton>
                            )}
                            <Labeling
                                deviceStaticSessionId={account.deviceState}
                                displayValue={<Translation id="TR_LABELING_ADD_LABEL" />}
                                payload={{
                                    type: 'outputLabel',
                                    entityKey: account.key,
                                    txid: utxo.txid,
                                    outputIndex: `${utxo.vout}`,
                                    defaultValue: `${utxo.txid}-${utxo.vout}`,
                                    networkSymbol: account.symbol,
                                    accountDescriptor: account.descriptor,
                                }}
                                gap={6}
                                leftAddon={
                                    <Icon
                                        name={outputLabel ? 'tagFilled' : 'tag'}
                                        intent="neutral"
                                        priority="secondary"
                                        size={12}
                                    />
                                }
                                placeholder={translationString('TR_LABELING_OUTPUT_LABEL')}
                                maxWidth={250}
                            >
                                {outputLabel}
                            </Labeling>
                        </InfoSegments>
                        {!!baseCurrencyValue && (
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                as="div"
                            >
                                {baseCurrencyValue}
                            </Text>
                        )}
                    </Row>
                </Column>
            </Row>
        </GhostContainer>
    );
};
