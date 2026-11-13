import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import { convertAmountSubunitsToUnits, formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, H4, InfoItem, Row, Text } from '@trezor/components';
import { type TokenInfo } from '@trezor/connect';
import type {
    DisplayFormatValue,
    ResolvedDisplayFormat,
} from '@trezor/network-ethereum-suite-common';
import { exhaustive } from '@trezor/type-utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { FormattedDate } from '#src/components/suite/FormattedDate';
import { type Account } from '#src/types/wallet';

import { type TransactionReviewOutputElementProps } from './TransactionReviewOutputElement';
import { TransactionReviewOutputStatus } from './TransactionReviewOutputStatus';

type DisplayFormatValueProps = {
    value: DisplayFormatValue;
    account: Pick<Account, 'symbol' | 'tokens'>;
    nativeToken?: TokenInfo;
};

const DisplayFormatValueView = ({ value, account, nativeToken }: DisplayFormatValueProps) => {
    switch (value.type) {
        case 'address':
            return <Address value={value.address} typographyStyle="body-sm" />;
        case 'nativeAmount':
            return (
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={
                        nativeToken
                            ? convertAmountSubunitsToUnits(value.amount, nativeToken.decimals)
                            : formatNetworkAmount(value.amount, account.symbol)
                    }
                    symbol={nativeToken?.symbol ?? account.symbol}
                    isTabular={false}
                />
            );
        case 'tokenAmount': {
            const { tokenAddress } = value;
            const token =
                tokenAddress &&
                account.tokens?.find(
                    ({ contract }) => contract.toLowerCase() === tokenAddress.toLowerCase(),
                );

            if (token) {
                return (
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={convertAmountSubunitsToUnits(value.amount, token.decimals)}
                        symbol={token.symbol}
                        contractAddress={token.contract}
                        isTabular={false}
                    />
                );
            }

            return (
                <Column alignItems="flex-end">
                    <Text>
                        {value.amount} <Translation id="TR_DISPLAY_FORMAT_UNKNOWN_TOKEN" />
                    </Text>
                    {tokenAddress && <Address value={tokenAddress} typographyStyle="body-sm" />}
                </Column>
            );
        }
        case 'aboveThreshold':
            return value.message ?? <Translation id="TR_DISPLAY_FORMAT_UNLIMITED" />;
        case 'date':
            return <FormattedDate value={value.timestamp * 1000} date time />;
        case 'text':
            return value.text;
        default:
            return exhaustive(value);
    }
};

type TransactionReviewDisplayFormatProps = {
    displayFormat: ResolvedDisplayFormat;
    state: TransactionReviewOutputElementProps['state'];
    account: Pick<Account, 'symbol' | 'tokens'>;
    nativeToken?: TokenInfo;
};

/** Fields of a contract call decoded with the same definition the device clear-signs it with. */
export const TransactionReviewDisplayFormat = ({
    displayFormat,
    state,
    account,
    nativeToken,
}: TransactionReviewDisplayFormatProps) => (
    <Card
        paddingType="small"
        type={state === 'confirmed' ? 'contrast' : 'raised'}
        header={
            <Row gap={12}>
                <TransactionReviewOutputStatus state={state} />
                <H4
                    margin={{ left: 4 }}
                    typographyStyle={state !== 'unconfirmed' ? 'body-sm-strong' : 'body-sm'}
                >
                    <Translation id="TR_TRANSACTION_DETAILS" />
                </H4>
            </Row>
        }
    >
        <Column gap={16} padding={{ left: 32 }} data-testid="@modal/display-format">
            {displayFormat.rows.map((row, rowIndex) => (
                <Text typographyStyle="body-sm" as="div" key={rowIndex}>
                    <InfoItem
                        label={<Text intent="neutral">{row.label}</Text>}
                        direction="row"
                        verticalAlignment="start"
                    >
                        <Column alignItems="flex-end" gap={4}>
                            {row.values.map((value, valueIndex) => (
                                <Text as="div" align="end" key={valueIndex}>
                                    <DisplayFormatValueView
                                        value={value}
                                        account={account}
                                        nativeToken={nativeToken}
                                    />
                                </Text>
                            ))}
                        </Column>
                    </InfoItem>
                </Text>
            ))}
        </Column>
    </Card>
);
