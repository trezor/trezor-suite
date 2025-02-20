import { useMemo } from 'react';

import { ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { selectHistoricFiatRatesByTimestamp } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import {
    formatAmount,
    formatNetworkAmount,
    getFiatRateKey,
    getTargetAmount,
    getTxOperation,
    isTestnet,
} from '@suite-common/wallet-utils';
import { copyToClipboard } from '@trezor/dom-utils';

import {
    AddressLabeling,
    FiatValue,
    FormattedCryptoAmount,
    MetadataLabeling,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLabelingValueBeingEdited } from 'src/reducers/suite/metadataReducer';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { AccountLabels } from 'src/types/suite/metadata';
import { WalletAccountTransaction } from 'src/types/wallet';

import { TargetAddressLabel } from './TargetAddressLabel';
import { TokenTransferAddressLabel } from './TokenTransferAddressLabel';
import { AmountComponent } from '../../AmountComponent';
import { TransactionTargetLayout } from '../TransactionTargetLayout';
import { CombinedTarget } from './TransactionTargetsList';

type TransactionTargetProps = CombinedTarget & {
    transaction: WalletAccountTransaction;
    accountKey: string;
    accountMetadata?: AccountLabels;
    isActionDisabled?: boolean;
    isPhishingTransaction: boolean;
    singleRowLayout?: boolean;
    useAnimation?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TransactionTarget = ({
    type,
    payload,
    transaction,
    accountMetadata,
    accountKey,
    isActionDisabled,
    isPhishingTransaction,
    ...baseLayoutProps
}: TransactionTargetProps) => {
    const dispatch = useDispatch();

    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(
        transaction.symbol,
        fiatCurrencyCode,
        type === 'token' ? (payload.contract as TokenAddress) : undefined,
    );
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );
    const labelingValueBeingEdited = useSelector(selectLabelingValueBeingEdited);

    const amount = useMemo(() => {
        switch (type) {
            case 'target':
                return getTargetAmount(payload, transaction);
            case 'internal':
                return payload.amount && formatNetworkAmount(payload.amount, transaction.symbol);
            case 'token':
                return formatAmount(payload.amount, payload.decimals);
        }
    }, [type, payload, transaction]);

    const operation = getTxOperation(type === 'target' ? transaction.type : payload.type);

    const amountComponent = useMemo(() => {
        switch (type) {
            case 'target':
            case 'internal':
                return amount && !baseLayoutProps.singleRowLayout ? (
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
                        withSign={true}
                        alignMultitoken="flex-end"
                    />
                );
        }
    }, [amount, baseLayoutProps.singleRowLayout, operation, transaction.symbol, type, payload]);
    const fiatAmountComponent = useMemo(
        () =>
            !isTestnet(transaction.symbol) && amount ? (
                <FiatValue
                    amount={amount}
                    symbol={transaction.symbol}
                    historicRate={historicRate}
                    useHistoricRate
                />
            ) : undefined,
        [amount, historicRate, transaction.symbol],
    );

    const { addressLabel, isBeingEdited } = useMemo(() => {
        switch (type) {
            case 'target': {
                const targetMetadata =
                    accountMetadata?.outputLabels?.[transaction.txid]?.[payload.n];
                const defaultMetadataValue = `${transaction.txid}-${payload.n}`;
                const isBeingEdited = defaultMetadataValue === labelingValueBeingEdited;

                const copyAddress = () => {
                    let toast: ToastPayload = { type: 'copy-to-clipboard' };
                    if (!payload?.addresses) {
                        // probably should not happen?
                        toast = {
                            type: 'error',
                            error: 'There is nothing to copy',
                        };
                    } else {
                        const result = copyToClipboard(payload.addresses.join());
                        if (typeof result === 'string') {
                            toast = {
                                type: 'error',
                                error: result,
                            };
                        }
                    }
                    dispatch(notificationsActions.addToast(toast));
                };

                return {
                    addressLabel: (
                        <MetadataLabeling
                            isDisabled={isActionDisabled}
                            defaultVisibleValue={
                                <TargetAddressLabel
                                    symbol={transaction.symbol}
                                    accountMetadata={accountMetadata}
                                    target={payload}
                                    type={transaction.type}
                                />
                            }
                            dropdownOptions={[
                                {
                                    onClick: copyAddress,
                                    label: <Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />,
                                    'data-testid': 'copy-address', // hack: This will be prefixed in the withDropdown()
                                },
                            ]}
                            payload={{
                                type: 'outputLabel',
                                entityKey: accountKey,
                                txid: transaction.txid,
                                outputIndex: payload.n,
                                defaultValue: defaultMetadataValue,
                                value: targetMetadata,
                            }}
                        />
                    ),
                    isBeingEdited,
                };
            }
            case 'token':
                return {
                    addressLabel: (
                        <TokenTransferAddressLabel
                            symbol={transaction.symbol}
                            isPhishingTransaction={isPhishingTransaction}
                            transfer={payload}
                            type={transaction.type}
                        />
                    ),
                };
            case 'internal':
                return {
                    addressLabel: (
                        <AddressLabeling address={payload.to} symbol={transaction.symbol} />
                    ),
                };
        }
    }, [
        type,
        payload,
        transaction,
        accountMetadata,
        accountKey,
        isActionDisabled,
        isPhishingTransaction,
        labelingValueBeingEdited,
        dispatch,
    ]);

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            useHiddenPlaceholder={!isBeingEdited}
            addressLabel={addressLabel}
            amount={amountComponent}
            fiatAmount={fiatAmountComponent}
        />
    );
};
