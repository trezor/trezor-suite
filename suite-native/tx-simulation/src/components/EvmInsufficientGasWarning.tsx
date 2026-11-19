import { computeGasFeeInWei, useHasSufficientFundsForGas } from '@suite-common/tx-simulation';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TxSimulationMethod } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type EvmInsufficientGasWarningProps = {
    accountBalance: string;
    gasLimit: string;
    networkSymbol: NetworkSymbol;
    transaction:
        TxSimulationMethod<'ethereumSignTransaction'>['payload']['transaction'] | undefined;
};

export function EvmInsufficientGasWarning({
    accountBalance,
    gasLimit,
    networkSymbol,
    transaction,
}: EvmInsufficientGasWarningProps) {
    const gasPriceInWei = transaction?.maxFeePerGas ?? transaction?.gasPrice;
    const hasSufficientFunds = useHasSufficientFundsForGas(
        gasPriceInWei ? computeGasFeeInWei(gasLimit, gasPriceInWei) : undefined,
        accountBalance,
    );

    if (hasSufficientFunds) {
        return null;
    }

    return (
        <BannerFull
            intent="warning"
            title={
                <Translation
                    id="transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee"
                    values={{
                        networkDisplaySymbol: (
                            <AssetSymbol networkSymbol={networkSymbol} color="contentWarning" />
                        ),
                    }}
                />
            }
        />
    );
}
