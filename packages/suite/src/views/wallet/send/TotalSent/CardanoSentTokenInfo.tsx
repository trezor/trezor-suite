import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { asAmountUnit } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSendFormContext } from '#src/hooks/wallet/useSendForm';

export const CardanoSentTokenInfo = () => {
    const { account, getValues, control, composedLevels } = useSendFormContext();

    const formOutputs = useWatch({ control, name: 'outputs', defaultValue: [] });
    const selectedFee = getValues().selectedFee || 'normal';
    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const hasTransactionInfo = transactionInfo !== undefined && transactionInfo.type !== 'error';

    const sentTokenList = useMemo(() => {
        const tokenAmountsMap = new Map(
            (formOutputs ?? []).filter(o => o.token).map(o => [o.token, o.amount]),
        );

        return account.tokens
            ?.filter(
                token =>
                    tokenAmountsMap.has(token.contract) &&
                    new BigNumber(tokenAmountsMap.get(token.contract) ?? 0).gt(0),
            )
            .map(token => ({
                contract: token.contract,
                amount: tokenAmountsMap.get(token.contract),
            }));
    }, [account.tokens, formOutputs]);

    if (account.networkType !== 'cardano' || !hasTransactionInfo) return null;

    return sentTokenList?.map(({ contract, amount }) => (
        <FormattedCryptoAmount
            key={contract}
            disableHiddenPlaceholder
            value={asAmountUnit(new BigNumber(amount ?? 0))}
            networkSymbol={account.symbol}
            contractAddress={contract}
        />
    ));
};
