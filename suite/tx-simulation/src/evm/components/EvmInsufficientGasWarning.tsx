import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type PrecomposedTransaction } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

interface EvmInsufficientGasWarningProps {
    composedLevel: PrecomposedTransaction | undefined;
    accountBalance: string;
    networkSymbol: NetworkSymbol;
}

export function EvmInsufficientGasWarning({
    composedLevel,
    accountBalance,
    networkSymbol,
}: EvmInsufficientGasWarningProps) {
    const fee = composedLevel?.type === 'final' ? composedLevel.fee : undefined;
    const hasSufficientFunds = useMemo(
        () => !fee || new BigNumber(fee).lte(accountBalance),
        [fee, accountBalance],
    );

    if (hasSufficientFunds) return null;

    return (
        <Banner
            intent="warning"
            icon
            data-testid="@tx-simulation-modal/insufficient-gas-banner"
            title={
                <Translation
                    id="AMOUNT_NOT_ENOUGH_CURRENCY_FEE"
                    values={{
                        networkDisplaySymbol: getNetworkDisplaySymbol(networkSymbol),
                    }}
                />
            }
        />
    );
}
