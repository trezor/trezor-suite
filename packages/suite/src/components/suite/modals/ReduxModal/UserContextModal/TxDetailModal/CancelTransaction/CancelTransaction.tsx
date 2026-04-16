import { Translation } from '@suite/intl';
import {
    type SelectedAccountLoaded,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, Divider, InfoItem, Row, Text, TextButton } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_CANCEL_TRANSACTION } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useCancelTxContext } from 'src/hooks/wallet/useCancelTxContext';

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

    if (!output) return null;

    const feePerByte = new BigNumber(composedCancelTx.feePerByte);
    const fee = formatNetworkAmount(composedCancelTx.fee, tx.symbol);

    const formattedOutputAmount = formatNetworkAmount(output.amount.toString(), tx.symbol);

    return (
        <Card
            fillType="flat"
            paddingType="small"
            header={
                <Row justifyContent="space-between">
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_CANCEL_TX_HEADER" />
                    </Text>
                    <TextButton href={HELP_CENTER_CANCEL_TRANSACTION} isUnderlined size="small">
                        <Translation id="TR_LEARN_MORE" />
                    </TextButton>
                </Row>
            }
        >
            <Column gap={spacings.md}>
                <Text typographyStyle="body-sm">
                    <Translation id="TR_CANCEL_TX_NOTICE" />
                </Text>

                <InfoItem
                    direction="row"
                    label={
                        <Row gap={spacings.md}>
                            <Translation id="TR_CANCEL_TX_FEE" />
                            <Text intent="neutral" priority="secondary">
                                <FeeRate feeRate={feePerByte} networkType={networkType} />
                            </Text>
                        </Row>
                    }
                    typographyStyle="body-md"
                    intent="neutral"
                    priority="primary"
                >
                    <Column gap={spacings.md} alignItems="flex-end">
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={fee ?? undefined}
                            symbol={tx.symbol}
                        />
                        <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                            <BaseCurrencyValue
                                disableHiddenPlaceholder
                                amount={fee ?? '0'}
                                symbol={tx.symbol}
                            />
                        </Text>
                    </Column>
                </InfoItem>

                <Divider margin={{ vertical: spacings.xs }} />

                <InfoItem
                    direction="row"
                    label={<Translation id="TR_CANCEL_TX_RETURN_TO_YOUR_WALLET" />}
                    typographyStyle="body-md"
                    intent="neutral"
                    priority="primary"
                >
                    <Column gap={spacings.md} alignItems="flex-end">
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={formattedOutputAmount}
                            symbol={tx.symbol}
                        />
                        <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                            <BaseCurrencyValue
                                disableHiddenPlaceholder
                                amount={formattedOutputAmount}
                                symbol={tx.symbol}
                            />
                        </Text>
                    </Column>
                </InfoItem>
            </Column>
        </Card>
    );
};
