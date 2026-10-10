import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    getCardanoTokenSendMinAdaAmount,
    isCardanoTokenSendAdaInsufficient,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { Banner, InfoItem, Text, Tooltip } from '@trezor/components';

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

    if (networkType !== 'cardano') return null;

    const minAdaAmount = getCardanoTokenSendMinAdaAmount({
        symbol,
        outputs: formOutputs,
        composedFeeLevel: composedLevels?.[selectedFee],
    });

    const hasEnoughADA = !isCardanoTokenSendAdaInsufficient({ balance, minAdaAmount });
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
                        value={subunitsToUnits({ symbol, value: minAdaAmount })}
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
