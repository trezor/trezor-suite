import { useMemo } from 'react';

import { selectSuiteSyncOutputLabels } from '@suite-common/suite-sync';
import { ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import {
    selectBaseCurrency,
    selectHistoricFiatRatesByTimestamp,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    formatNetworkAmount,
    getFiatRateKey,
    getTargetAmount,
    getTxOperation,
} from '@suite-common/wallet-utils';
import { copyToClipboard } from '@trezor/dom-utils';
import { exhaustive } from '@trezor/type-utils';

import {
    AddressLabeling,
    BaseCurrencyValue,
    FormattedCryptoAmount,
    MetadataLabeling,
} from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLabelingValueBeingEdited } from 'src/reducers/suite/metadataReducer';
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
        selectSuiteSyncOutputLabels(state, transaction.deviceState),
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
            default:
                return exhaustive(type);
        }
    }, [amount, baseLayoutProps.singleRowLayout, operation, transaction.symbol, type, payload]);

    const fiatAmountComponent = useMemo(
        () =>
            shallDisplayBaseCurrency && amount && transaction.type !== 'self' ? (
                <BaseCurrencyValue
                    amount={amount}
                    symbol={transaction.symbol}
                    historicRate={historicRate}
                    useHistoricRate
                />
            ) : undefined,
        [shallDisplayBaseCurrency, amount, transaction.type, transaction.symbol, historicRate],
    );

    const metadataId = useMemo(() => {
        switch (type) {
            case 'target':
                return payload.n;
            case 'token':
                return `token-${payload.contract}`;
            case 'internal':
                return `internal-${payload.to}`;
            default:
                return exhaustive(type);
        }
    }, [type, payload]);

    const targetMetadata = accountMetadata?.outputLabels?.[transaction.txid]?.[metadataId];

    const defaultMetadataValue = `${transaction.txid}-${metadataId}`;
    const isBeingEdited = defaultMetadataValue === labelingValueBeingEdited;

    const copyAddress = () => {
        let toast: ToastPayload = { type: 'copy-to-clipboard' };
        const addresses = type === 'target' ? payload.addresses : [payload.to];
        if (!addresses) {
            // probably should not happen?
            toast = {
                type: 'error',
                error: 'There is nothing to copy',
            };
        } else {
            const result = copyToClipboard(addresses.join());
            if (typeof result === 'string') {
                toast = {
                    type: 'error',
                    error: result,
                };
            }
        }
        dispatch(notificationsActions.addToast(toast));
    };

    const label = useMemo(() => {
        switch (type) {
            case 'target':
                return (
                    <TargetAddressLabel
                        symbol={transaction.symbol}
                        accountMetadata={accountMetadata}
                        target={payload}
                        type={transaction.type}
                        deviceStaticSessionId={transaction.deviceState}
                    />
                );
            case 'token':
                return (
                    <TokenTransferAddressLabel
                        symbol={transaction.symbol}
                        isPhishingTransaction={isPhishingTransaction}
                        transfer={payload}
                        type={transaction.type}
                    />
                );
            case 'internal':
                return <AddressLabeling address={payload.to} symbol={transaction.symbol} />;
            default:
                return exhaustive(type);
        }
    }, [type, transaction, payload, accountMetadata, isPhishingTransaction]);

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            useHiddenPlaceholder={!isBeingEdited}
            addressLabel={
                <MetadataLabeling
                    variant="button"
                    deviceStaticSessionId={transaction.deviceState}
                    isDisabled={isActionDisabled}
                    defaultVisibleValue={label}
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
                        outputIndex: metadataId,
                        defaultValue: defaultMetadataValue,
                        value:
                            suiteSyncOutputLabels.find(
                                it => it.txId === transaction.txid && it.outputIndex == metadataId,
                            )?.label ?? targetMetadata,
                        networkSymbol: transaction.symbol,
                        accountDescriptor: transaction.descriptor,
                    }}
                />
            }
            amount={amountComponent}
            fiatAmount={fiatAmountComponent}
        />
    );
};
