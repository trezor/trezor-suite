import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import {
    selectIsLegacyLabelingVisible,
    selectLabelingDataForAccount,
    selectLabelingValueBeingEdited,
} from '@suite/metadata';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { selectIsSuiteSyncEnabled, selectSuiteSyncOutputLabels } from '@suite-common/suite-sync';
import { type SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import {
    type Target,
    selectBaseCurrency,
    selectHistoricFiatRatesByTimestamp,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey, type Timestamp, type TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    formatNetworkAmount,
    getFiatRateKey,
    getTargetAmount,
    getTxOperation,
    isNftTokenTransfer,
} from '@suite-common/wallet-utils';
import { Icon } from '@trezor/components';
import { TagFilledIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

import { BaseCurrencyValue, FormattedCryptoAmount, Sign } from 'src/components/suite';
import { AccountLabelForOwnAddress } from 'src/components/suite/labeling/AccountLabelForOwnAddress';
import { useSelector } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

import { TargetAddressLabel } from './TargetAddressLabel';
import { TokenTransferAddressLabel } from './TokenTransferAddressLabel';
import { AmountComponent } from '../../AmountComponent';
import { TransactionTargetLayout } from '../TransactionTargetLayout';

type TransactionTargetProps = Target & {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isActionDisabled?: boolean;
    isPhishingTransaction?: boolean;
};

export const TransactionTarget = ({
    type,
    payload,
    transaction,
    accountKey,
    isActionDisabled,
    isPhishingTransaction,
    targetId,
    ...baseLayoutProps
}: TransactionTargetProps) => {
    const { translationString } = useTranslation();

    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, accountKey));
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(
        transaction.symbol,
        baseCurrencyCode,
        type === 'token' ? (payload.contract as TokenAddress) : undefined,
    );

    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(transaction.symbol);

    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );
    const labelingValueBeingEdited = useSelector(selectLabelingValueBeingEdited);

    const suiteSyncOutputLabels = useSelector(state =>
        isSuiteSyncEnabled
            ? selectSuiteSyncOutputLabels(state, transaction.deviceState)
            : returnStableArrayIfEmpty<SuiteSyncOutput>(),
    );

    const isSolanaUnstakeTx = transaction?.solanaSpecific?.stakeOperation?.type === 'unstake';

    const amount = useMemo(() => {
        // hide amount for solana unstake transactions
        if (isSolanaUnstakeTx) return null;

        switch (type) {
            case 'target':
                return getTargetAmount(payload, transaction);
            case 'internal':
                return payload.amount && formatNetworkAmount(payload.amount, transaction.symbol);
            case 'token':
                return convertAmountSubunitsToUnits(payload.amount, payload.decimals);
            default:
                return exhaustive(type);
        }
    }, [type, payload, transaction, isSolanaUnstakeTx]);

    const operation = getTxOperation(type === 'target' ? transaction.type : payload.type);

    const amountComponent = useMemo(() => {
        switch (type) {
            case 'target':
            case 'internal':
                return amount && transaction.type !== 'self' ? (
                    <FormattedCryptoAmount
                        value={amount}
                        symbol={transaction.symbol}
                        signValue={operation}
                    />
                ) : undefined;
            case 'token':
                return (
                    <AmountComponent
                        transfer={payload}
                        withLink={false}
                        withSign
                        alignMultitoken="flex-end"
                    />
                );
            default:
                return exhaustive(type);
        }
    }, [amount, operation, transaction.symbol, type, payload, transaction.type]);

    const isNft = type === 'token' && isNftTokenTransfer(payload);

    const fiatAmountComponent = useMemo(
        () =>
            shallDisplayBaseCurrency &&
            amount &&
            historicRate &&
            transaction.type !== 'self' &&
            !isPhishingTransaction &&
            !isNft ? (
                <>
                    {operation && <Sign value={operation} grayscale />}
                    <BaseCurrencyValue
                        amount={amount}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
                </>
            ) : undefined,
        [
            shallDisplayBaseCurrency,
            amount,
            transaction.type,
            transaction.symbol,
            historicRate,
            isPhishingTransaction,
            operation,
            isNft,
        ],
    );

    const targetMetadata = accountMetadata?.outputLabels?.[transaction.txid]?.[`${targetId}`];

    const defaultMetadataValue = `${transaction.txid}-${targetId}`;
    const isBeingEdited = defaultMetadataValue === labelingValueBeingEdited;

    const label = useMemo(() => {
        switch (type) {
            case 'target':
                return (
                    <TargetAddressLabel
                        symbol={transaction.symbol}
                        accountKey={accountKey}
                        target={payload}
                        type={transaction.type}
                        deviceStaticSessionId={transaction.deviceState}
                    />
                );
            case 'token':
                return <TokenTransferAddressLabel symbol={transaction.symbol} transfer={payload} />;
            case 'internal':
                return (
                    <AccountLabelForOwnAddress
                        address={payload.to || payload.from}
                        symbol={transaction.symbol}
                    />
                );
            default:
                return exhaustive(type);
        }
    }, [accountKey, type, transaction, payload]);

    const outputLabel =
        suiteSyncOutputLabels.find(it => it.txId === transaction.txid && it.txTargetId === targetId)
            ?.label ?? (isLegacyLabelingVisible ? targetMetadata : undefined);

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            useHiddenPlaceholder={!isBeingEdited}
            isPhishingTransaction={isPhishingTransaction}
            addressLabel={
                <Labeling
                    deviceStaticSessionId={transaction.deviceState}
                    isDisabled={isActionDisabled || isPhishingTransaction}
                    displayValue={label}
                    placeholder={translationString('TR_LABELING_OUTPUT_LABEL')}
                    payload={{
                        type: 'outputLabel',
                        entityKey: accountKey,
                        txid: transaction.txid,
                        outputIndex: `${targetId}`,
                        defaultValue: defaultMetadataValue,
                        networkSymbol: transaction.symbol,
                        accountDescriptor: transaction.descriptor,
                    }}
                    leftAddon={
                        outputLabel ? (
                            <Icon
                                as={TagFilledIcon}
                                size={14}
                                intent="neutral"
                                priority="secondary"
                            />
                        ) : undefined
                    }
                >
                    {outputLabel}
                </Labeling>
            }
            amount={amountComponent}
            fiatAmount={fiatAmountComponent}
        />
    );
};
