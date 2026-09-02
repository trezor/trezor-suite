import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { MIN_CARDANO_AMOUNT_FOR_SEND } from '@suite-common/wallet-constants';
import {
    asAmountSubunit,
    asAmountUnit,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { Banner, InfoItem, Text, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';

export const CardanoMinAmountInfo = () => {
    const {
        account: { symbol, networkType, balance },
        composedLevels,
        getValues,
    } = useSendFormContext();

    const formOutputs = getValues().outputs;
    const selectedFee = getValues().selectedFee || 'normal';

    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const hasTransactionInfo = transactionInfo !== undefined && transactionInfo.type !== 'error';

    if (networkType !== 'cardano') return null;

    const totalAdaAmount = formOutputs.reduce((acc, output) => {
        if (!output.token && !!output.amount) {
            return acc.plus(output.amount ?? 0);
        }

        return acc;
    }, new BigNumber(0));

    const minAdaAmount = new BigNumber(
        hasTransactionInfo
            ? transactionInfo.totalSpent
            : new BigNumber(MIN_CARDANO_AMOUNT_FOR_SEND)
                  .times(formOutputs.length)
                  .plus(unitsToSubunits({ symbol, value: asAmountUnit(totalAdaAmount) })),
    );

    const hasEnoughADA = new BigNumber(balance).minus(minAdaAmount).gte(0);
    const networkDisplaySymbol = getNetworkDisplaySymbol(symbol);

    return (
        <>
            <InfoItem
                direction="row"
                label={
                    <Tooltip
                        hasIcon
                        maxWidth={328}
                        content={
                            <Translation
                                id="TR_SEND_MIN_ADA_AMOUNT_TOOLTIP"
                                values={{ networkDisplaySymbol }}
                            />
                        }
                    >
                        <Translation
                            id="TR_SEND_MIN_ADA_AMOUNT_TITLE"
                            values={{ networkDisplaySymbol }}
                        />
                    </Tooltip>
                }
            >
                <Text intent="neutral" priority="secondary">
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={subunitsToUnits({
                            symbol,
                            value: asAmountSubunit(minAdaAmount),
                        })}
                        symbol={symbol}
                    />
                </Text>
            </InfoItem>
            {!hasEnoughADA && (
                <Banner
                    intent="critical"
                    icon
                    description={
                        <Translation
                            id="TR_SEND_MIN_ADA_AMOUNT"
                            values={{ networkDisplaySymbol }}
                        />
                    }
                />
            )}
        </>
    );
};
