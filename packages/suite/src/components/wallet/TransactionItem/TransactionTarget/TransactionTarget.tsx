import { notificationsActions, ToastPayload } from '@suite-common/toast-notifications';
import {
    getTxOperation,
    getTargetAmount,
    isTestnet,
    formatAmount,
    formatNetworkAmount,
    isNftTokenTransfer,
    getFiatRateKey,
} from '@suite-common/wallet-utils';
import { copyToClipboard } from '@trezor/dom-utils';
import { ArrayElement } from '@trezor/type-utils';
import { FiatValue, Translation, MetadataLabeling, AddressLabeling } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { TokenTransferAddressLabel } from './TokenTransferAddressLabel';
import { TargetAddressLabel } from './TargetAddressLabel';
import { AccountLabels } from 'src/types/suite/metadata';
import { TransactionTargetLayout } from '../TransactionTargetLayout';
import { StyledFormattedCryptoAmount, StyledFormattedNftAmount } from '../CommonComponents';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectHistoricFiatRatesByTimestamp } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';

interface BaseTransfer {
    singleRowLayout?: boolean;
    useAnimation?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}

interface TokenTransferProps extends BaseTransfer {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    transaction: WalletAccountTransaction;
    isPhishingTransaction: boolean;
}

export const TokenTransfer = ({
    transfer,
    transaction,
    isPhishingTransaction,
    ...baseLayoutProps
}: TokenTransferProps) => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(
        transaction.symbol,
        fiatCurrencyCode,
        transfer.contract as TokenAddress,
    );
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    const operation = getTxOperation(transfer.type);
    const isNft = isNftTokenTransfer(transfer);

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            addressLabel={
                <TokenTransferAddressLabel
                    networkSymbol={transaction.symbol}
                    isPhishingTransaction={isPhishingTransaction}
                    transfer={transfer}
                    type={transaction.type}
                />
            }
            amount={
                isNft ? (
                    <StyledFormattedNftAmount transfer={transfer} signValue={operation} />
                ) : (
                    <StyledFormattedCryptoAmount
                        value={formatAmount(transfer.amount, transfer.decimals)}
                        symbol={transfer.symbol}
                        signValue={operation}
                    />
                )
            }
            fiatAmount={
                !isTestnet(transaction.symbol) && transfer.amount ? (
                    <FiatValue
                        amount={formatAmount(transfer.amount, transfer.decimals)}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
                ) : undefined
            }
        />
    );
};

interface InternalTransferProps extends BaseTransfer {
    transfer: ArrayElement<WalletAccountTransaction['internalTransfers']>;
    transaction: WalletAccountTransaction;
}

export const InternalTransfer = ({
    transfer,
    transaction,
    ...baseLayoutProps
}: InternalTransferProps) => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    const amount = transfer.amount && formatNetworkAmount(transfer.amount, transaction.symbol);
    const operation = getTxOperation(transfer.type);

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            addressLabel={
                <AddressLabeling address={transfer.to} networkSymbol={transaction.symbol} />
            }
            amount={
                !baseLayoutProps.singleRowLayout && (
                    <StyledFormattedCryptoAmount
                        value={amount}
                        symbol={transaction.symbol}
                        signValue={operation}
                    />
                )
            }
            fiatAmount={
                !isTestnet(transaction.symbol) && amount ? (
                    <FiatValue
                        amount={amount}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
                ) : undefined
            }
        />
    );
};

interface TransactionTargetProps extends BaseTransfer {
    target: ArrayElement<WalletAccountTransaction['targets']>;
    transaction: WalletAccountTransaction;
    accountKey: string;
    accountMetadata?: AccountLabels;
    isActionDisabled?: boolean;
    isPhishingTransaction: boolean;
}

export const TransactionTarget = ({
    target,
    transaction,
    accountMetadata,
    accountKey,
    isActionDisabled,
    isPhishingTransaction,
    ...baseLayoutProps
}: TransactionTargetProps) => {
    const dispatch = useDispatch();

    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    const targetAmount = getTargetAmount(target, transaction);
    const operation = getTxOperation(transaction.type);
    const targetMetadata = accountMetadata?.outputLabels?.[transaction.txid]?.[target.n];

    const copyAddress = () => {
        let payload: ToastPayload = { type: 'copy-to-clipboard' };
        if (!target?.addresses) {
            // probably should not happen?
            payload = {
                type: 'error',
                error: 'There is nothing to copy',
            };
        } else {
            const result = copyToClipboard(target.addresses.join());
            if (typeof result === 'string') {
                payload = {
                    type: 'error',
                    error: result,
                };
            }
        }
        dispatch(notificationsActions.addToast(payload));
    };

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            addressLabel={
                <MetadataLabeling
                    isDisabled={isActionDisabled}
                    defaultVisibleValue={
                        <TargetAddressLabel
                            networkSymbol={transaction.symbol}
                            accountMetadata={accountMetadata}
                            target={target}
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
                        outputIndex: target.n,
                        defaultValue: `${transaction.txid}-${target.n}`,
                        value: targetMetadata,
                    }}
                />
            }
            amount={
                targetAmount && !baseLayoutProps.singleRowLayout ? (
                    <StyledFormattedCryptoAmount
                        value={targetAmount}
                        symbol={transaction.symbol}
                        signValue={operation}
                    />
                ) : undefined
            }
            fiatAmount={
                !isTestnet(transaction.symbol) && targetAmount ? (
                    <FiatValue
                        amount={targetAmount}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
                ) : undefined
            }
        />
    );
};
