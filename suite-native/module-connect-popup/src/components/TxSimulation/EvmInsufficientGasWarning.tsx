import { computeGasFeeInWei, useHasSufficientFundsForGas } from '@suite-common/tx-simulation';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type TxSimulationMethod } from '@suite-common/wallet-types';
import { FullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

interface EvmInsufficientGasWarningProps {
    transaction:
        | TxSimulationMethod<'ethereumSignTransaction'>['payload']['transaction']
        | undefined;
    gasLimit: string;
    accountBalance: string;
    networkSymbol: NetworkSymbol;
}

export function EvmInsufficientGasWarning({
    transaction,
    gasLimit,
    accountBalance,
    networkSymbol,
}: EvmInsufficientGasWarningProps) {
    const gasPriceInWei = transaction?.maxFeePerGas ?? transaction?.gasPrice;
    const hasSufficientFunds = useHasSufficientFundsForGas(
        gasPriceInWei ? computeGasFeeInWei(gasLimit, gasPriceInWei) : undefined,
        accountBalance,
    );

    if (hasSufficientFunds) return null;

    return (
        <FullAlertBox
            variant="warning"
            title={
                <Translation
                    id="transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee"
                    values={{
                        networkDisplaySymbol: getNetworkDisplaySymbol(networkSymbol),
                    }}
                />
            }
        />
    );
}
