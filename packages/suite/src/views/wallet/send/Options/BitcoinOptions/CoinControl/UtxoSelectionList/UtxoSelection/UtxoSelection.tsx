import { type MouseEventHandler, type ReactNode } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import {
    selectIsLegacyLabelingVisible,
    selectLabelingDataForSelectedAccount,
} from '@suite/metadata';
import { openModal } from '@suite/modal';
import {
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAddressLabels,
    selectSuiteSyncOutputLabels,
} from '@suite-common/suite-sync';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
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
import { type AccountUtxo } from '@trezor/connect';

import { Address, BaseCurrencyValue, FormattedCryptoAmount, Labeling } from 'src/components/suite';
import { TransactionTimestamp, UtxoAnonymity } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { useCoinjoinUnavailableUtxos } from 'src/hooks/wallet/form/useCoinjoinUnavailableUtxos';
import { type WalletAccountTransaction } from 'src/types/wallet';

type ResolveUtxoSpendableProps = {
    utxo: AccountUtxo;
    coinjoinRegisteredUtxos: AccountUtxo[];
};

// Same as MINIMAL_COINBASE_CONFIRMATIONS in '@trezor/utxo-lib'; It is redeclared here to avoid
// some magic import/export errors. This is very niche stuff and probably never changes.
// Also, this most probably bothers only developers on Regtest.
const MINIMAL_COINBASE_CONFIRMATIONS = 100;

const resolveUtxoSpendable = ({
    utxo,
    coinjoinRegisteredUtxos,
}: ResolveUtxoSpendableProps): ReactNode | null => {
    if (utxo.coinbase === true && utxo.confirmations < MINIMAL_COINBASE_CONFIRMATIONS) {
        return (
            <Translation
                id="TR_UTXO_NOT_MATURED_COINBASE"
                values={{ confirmations: MINIMAL_COINBASE_CONFIRMATIONS }}
            />
        );
    }

    if (coinjoinRegisteredUtxos.includes(utxo)) {
        return <Translation id="TR_UTXO_REGISTERED_IN_COINJOIN" />;
    }

    return null;
};

type UtxoSelectionProps = {
    transaction?: WalletAccountTransaction;
    utxo: AccountUtxo;
};

export const UtxoSelection = ({ transaction, utxo }: UtxoSelectionProps) => {
    const {
        account,
        network,
        utxoSelection: {
            selectedUtxos,
            coinjoinRegisteredUtxos,
            composedInputs,
            toggleUtxoSelection,
            isCoinControlEnabled,
        },
    } = useSendFormContext();

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);

    // selecting metadata from store rather than send form context which does not update on metadata change
    const { addressLabels, outputLabels } = useSelector(selectLabelingDataForSelectedAccount);
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account.symbol);
    const suiteSyncAddressLabels = useSelector(state =>
        isSuiteSyncEnabled ? selectSuiteSyncAddressLabels(state, account.deviceState) : [],
    );

    const suiteSyncOutputLabels = useSelector(state =>
        isSuiteSyncEnabled ? selectSuiteSyncOutputLabels(state, account.deviceState) : [],
    );
    const { translationString } = useTranslation();

    const dispatch = useDispatch();

    const coinjoinUnavailableMessage = useCoinjoinUnavailableUtxos({ account, utxo });
    const isPendingTransaction = utxo.confirmations === 0;
    const isChangeAddress = utxo.path.split('/').at(-2) === '1'; // change address always has a 1 on the penultimate level of the derivation path
    const anonymity = account.addresses?.anonymitySet?.[utxo.address];

    const isChecked = isCoinControlEnabled
        ? selectedUtxos.some(selected => isSameUtxo(selected, utxo))
        : composedInputs.some(u => u.prev_hash === utxo.txid && u.prev_index === utxo.vout);

    const unspendableTooltip = resolveUtxoSpendable({ utxo, coinjoinRegisteredUtxos });
    const isDisabled = unspendableTooltip !== null;

    const handleCheckbox = () => toggleUtxoSelection(utxo);
    const showTransactionDetail: MouseEventHandler = e => {
        e.stopPropagation();

        if (transaction) {
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid: transaction.txid,
                    descriptor: transaction.descriptor,
                    symbol: transaction.symbol,
                    deviceState: transaction.deviceState,
                    flow: 'detail',
                }),
            );
        }
    };

    const addressLabel =
        suiteSyncAddressLabels.find(it => it.address === utxo.address)?.label ??
        (isLegacyLabelingVisible ? addressLabels[utxo.address] : undefined);

    const outputLabel =
        suiteSyncOutputLabels.find(it => it.txId === utxo.txid && it.txTargetId === `${utxo.vout}`)
            ?.label ??
        (isLegacyLabelingVisible ? outputLabels?.[utxo.txid]?.[utxo.vout] : undefined);

    return (
        <GhostContainer onClick={handleCheckbox} padding={12} margin={{ horizontal: -12 }} as="div">
            <Row gap={24} width="100%">
                <Tooltip content={unspendableTooltip}>
                    <Checkbox
                        isChecked={isChecked}
                        isDisabled={isDisabled}
                        onChange={handleCheckbox}
                        onClick={e => e.stopPropagation()}
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
                                    value: addressLabel,
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
                                        {coinjoinUnavailableMessage && (
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
                        <FormattedCryptoAmount
                            value={formatNetworkAmount(utxo.amount, account.symbol)}
                            symbol={account.symbol}
                        />
                    </Row>
                    <Row justifyContent="space-between" gap={12}>
                        <InfoSegments
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            gap={6}
                        >
                            {transaction ? (
                                <TransactionTimestamp showDate transaction={transaction} />
                            ) : (
                                <Tooltip
                                    cursor="pointer"
                                    content={<Translation id="TR_LOADING_TRANSACTION_DETAILS" />}
                                >
                                    <Spinner size={16} isDisabled={true} />
                                </Tooltip>
                            )}
                            {anonymity && <UtxoAnonymity anonymity={anonymity} />}
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
                                    value: outputLabel,
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
                        {shallDisplayBaseCurrency && (
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                as="div"
                            >
                                <BaseCurrencyValue
                                    amount={formatNetworkAmount(utxo.amount, account.symbol, false)}
                                    symbol={network.symbol}
                                />
                            </Text>
                        )}
                    </Row>
                </Column>
            </Row>
        </GhostContainer>
    );
};
