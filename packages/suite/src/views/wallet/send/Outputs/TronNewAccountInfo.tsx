import { Translation } from '@suite/intl';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { InfoItem, Tooltip } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';

export const TronNewAccountInfo = () => {
    const {
        account: { symbol, networkType },
        composedLevels,
        getValues,
    } = useSendFormContext();

    if (networkType !== 'tron') return null;

    const selectedFee = getValues().selectedFee || 'normal';
    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const hasTransactionInfo = transactionInfo !== undefined && transactionInfo.type !== 'error';

    if (!hasTransactionInfo) return null;

    const accountActivationFee =
        'accountActivationFee' in transactionInfo
            ? transactionInfo.accountActivationFee
            : undefined;

    if (!accountActivationFee) return null;

    return (
        <InfoItem
            direction="row"
            typographyStyle="body-md"
            priority="primary"
            label={
                <Tooltip
                    hasIcon
                    maxWidth={328}
                    content={<Translation id="TR_TRON_ACCOUNT_ACTIVATION_FEE_TOOLTIP" />}
                >
                    <Translation id="TR_TRON_ACCOUNT_ACTIVATION_FEE" />
                </Tooltip>
            }
        >
            <FormattedCryptoAmount
                disableHiddenPlaceholder
                value={formatNetworkAmount(accountActivationFee, symbol)}
                symbol={symbol}
            />
        </InfoItem>
    );
};
