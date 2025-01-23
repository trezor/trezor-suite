import { SelectedAccountLoaded, WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount, getFeeUnits } from '@suite-common/wallet-utils';
import { Card, Column, Divider, InfoItem, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_CANCEL_TRANSACTION } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { useCancelTxContext } from '../../../../../../../hooks/wallet/useCancelTxContext';
import { FiatValue } from '../../../../../FiatValue';
import { FormattedCryptoAmount } from '../../../../../FormattedCryptoAmount';
import { Translation } from '../../../../../Translation';
import { TrezorLink } from '../../../../../TrezorLink';

type CancelTransactionProps = {
    tx: WalletAccountTransaction;
    selectedAccount: SelectedAccountLoaded;
};

export const CancelTransaction = ({ tx, selectedAccount }: CancelTransactionProps) => {
    const { account } = selectedAccount;
    const { networkType } = account;

    const { composedCancelTx } = useCancelTxContext();

    if (composedCancelTx === null) {
        return;
    }

    if (composedCancelTx.outputs.length !== 1) {
        return null;
    }

    const output = composedCancelTx.outputs[0];

    const feePerByte = new BigNumber(composedCancelTx.feePerByte);
    const fee = formatNetworkAmount(composedCancelTx.fee, tx.symbol);

    return (
        <Card fillType="flat" paddingType="none">
            <Row justifyContent="space-between" margin={spacings.md}>
                <Text typographyStyle="highlight">
                    <Translation id="TR_CANCEL_TX_HEADER" />
                </Text>

                <Text typographyStyle="hint">
                    <TrezorLink
                        variant="nostyle"
                        href={HELP_CENTER_CANCEL_TRANSACTION}
                        icon="arrowUpRight"
                    >
                        <Translation id="TR_LEARN_MORE" />
                    </TrezorLink>
                </Text>
            </Row>

            <Divider margin={spacings.zero} />

            <Column gap={spacings.md} margin={spacings.md}>
                <Text typographyStyle="hint">
                    <Translation id="TR_CANCEL_TX_NOTICE" />
                </Text>

                <InfoItem
                    direction="row"
                    label={
                        <Row gap={spacings.md}>
                            <Translation id="TR_CANCEL_TX_FEE" />
                            <Text variant="tertiary">
                                {feePerByte.toFormat(2)}&nbsp;
                                {getFeeUnits(networkType)}
                            </Text>
                        </Row>
                    }
                    typographyStyle="body"
                    variant="default"
                >
                    <Column gap={spacings.md} alignItems="flex-end">
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={fee ?? undefined}
                            symbol={tx.symbol}
                        />
                        <Text variant="tertiary" typographyStyle="label">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={fee ?? '0'}
                                symbol={tx.symbol}
                            />
                        </Text>
                    </Column>
                </InfoItem>

                <Divider
                    orientation="horizontal"
                    margin={{ top: spacings.xs, bottom: spacings.xs }}
                />

                <InfoItem
                    direction="row"
                    label={<Translation id="TR_CANCEL_TX_RETURN_TO_YOUR_WALLET" />}
                    typographyStyle="body"
                    variant="default"
                >
                    <Column gap={spacings.md} alignItems="flex-end">
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={formatNetworkAmount(output.amount.toString(), tx.symbol)}
                            symbol={tx.symbol}
                        />
                        <Text variant="tertiary" typographyStyle="label">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={output.amount.toString()}
                                symbol={tx.symbol}
                            />
                        </Text>
                    </Column>
                </InfoItem>
            </Column>
        </Card>
    );
};
