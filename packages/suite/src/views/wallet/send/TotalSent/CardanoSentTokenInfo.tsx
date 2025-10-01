import { useMemo } from 'react';

import { asAmountUnit } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet/useSendForm';

export const CardanoSentTokenInfo = () => {
    const {
        account: { networkType, tokens },
        getValues,
        composedLevels,
    } = useSendFormContext();

    const formOutputs = getValues().outputs;
    const selectedFee = getValues().selectedFee || 'normal';
    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const hasTransactionInfo = transactionInfo !== undefined && transactionInfo.type !== 'error';

    const sentTokenList = useMemo(() => {
        const tokenAmountsMap = new Map(
            (formOutputs ?? []).filter(o => o.token).map(o => [o.token, o.amount]),
        );

        return tokens
            ?.filter(
                token =>
                    tokenAmountsMap.has(token.contract) &&
                    new BigNumber(tokenAmountsMap.get(token.contract) ?? 0).gt(0),
            )
            .map(token => [token.symbol?.toUpperCase(), tokenAmountsMap.get(token.contract)]);
    }, [tokens, formOutputs]);

    if (networkType !== 'cardano' && !hasTransactionInfo) return null;

    return sentTokenList?.map(([tokenSymbol, amount]) => (
        <FormattedCryptoAmount
            key={tokenSymbol}
            disableHiddenPlaceholder
            value={asAmountUnit(new BigNumber(amount ?? 0))}
            symbol={tokenSymbol}
        />
    ));
};
