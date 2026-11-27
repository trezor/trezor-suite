import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits, formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, H4, InfoItem, Row, Text } from '@trezor/components';
import { type TokenInfo } from '@trezor/connect';
import type {
    DisplayFormatRow,
    DisplayFormatSubcallPosition,
    DisplayFormatValue,
    ResolvedDisplayFormat,
} from '@trezor/network-ethereum-suite-common';
import { exhaustive } from '@trezor/type-utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { FormattedDate } from '#src/components/suite/FormattedDate';

import { type TransactionReviewOutputElementProps } from './TransactionReviewOutputElement';
import { TransactionReviewOutputStatus } from './TransactionReviewOutputStatus';

type DisplayFormatValueProps = {
    value: DisplayFormatValue;
    account: Pick<Account, 'symbol' | 'tokens'>;
    nativeToken?: TokenInfo;
};

const findAccountToken = (account: Pick<Account, 'tokens'>, tokenAddress: string) =>
    account.tokens?.find(({ contract }) => contract.toLowerCase() === tokenAddress.toLowerCase());

type UnknownTokenContractProps = {
    account: Pick<Account, 'tokens'>;
    tokenAddress?: string;
};

// The device names the contract of a token it does not know.
const UnknownTokenContract = ({ account, tokenAddress }: UnknownTokenContractProps) =>
    tokenAddress && !findAccountToken(account, tokenAddress) ? (
        <Address value={tokenAddress} typographyStyle="body-sm" />
    ) : null;

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
                    networkSymbol={account.symbol}
                    contractAddress={nativeToken?.contract}
                    isTabular={false}
                />
            );
        case 'tokenAmount': {
            const { tokenAddress } = value;
            const token = tokenAddress && findAccountToken(account, tokenAddress);

            if (token) {
                return (
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={convertAmountSubunitsToUnits(value.amount, token.decimals)}
                        networkSymbol={account.symbol}
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
                    <UnknownTokenContract account={account} tokenAddress={tokenAddress} />
                </Column>
            );
        }
        case 'aboveThreshold':
            return (
                <Column alignItems="flex-end">
                    <Text>{value.message ?? <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />}</Text>
                    <UnknownTokenContract account={account} tokenAddress={value.tokenAddress} />
                </Column>
            );
        case 'date':
            return <FormattedDate value={value.timestamp * 1000} date time />;
        case 'text':
            return value.text;
        default:
            return exhaustive(value);
    }
};

const SubcallName = ({ index }: DisplayFormatSubcallPosition) =>
    index === undefined ? (
        <Translation id="TR_DISPLAY_FORMAT_SUBCALL" />
    ) : (
        <Translation id="TR_DISPLAY_FORMAT_NUMBERED_SUBCALL" values={{ index }} />
    );

// Labels follow the device, which prefixes the rows of an embedded call with its position.
type DisplayFormatRowLabelProps = {
    row: DisplayFormatRow;
};

const DisplayFormatInnerRowLabel = ({ row }: DisplayFormatRowLabelProps) => {
    if (!row.subcall) {
        return row.type === 'field' ? row.label : null;
    }
    const subcall = <SubcallName index={row.subcall.index} />;

    switch (row.type) {
        case 'field':
            return (
                <Translation
                    id="TR_DISPLAY_FORMAT_SUBCALL_FIELD"
                    values={{ subcall, label: row.label }}
                />
            );
        case 'subcallProvider':
            return <Translation id="TR_DISPLAY_FORMAT_SUBCALL_PROVIDER" values={{ subcall }} />;
        case 'subcallIntent':
            return <Translation id="TR_DISPLAY_FORMAT_SUBCALL_INTENT" values={{ subcall }} />;
        case 'subcallCallee':
            return row.subcall.index === undefined ? (
                <Translation id="TR_DISPLAY_FORMAT_SINGLE_SUBCALL_TO" />
            ) : (
                <Translation id="TR_DISPLAY_FORMAT_SUBCALL_TO" values={{ subcall }} />
            );
        default:
            return exhaustive(row);
    }
};

const DisplayFormatRowLabel = ({ row }: DisplayFormatRowLabelProps) => {
    const outer = row.subcall?.outer;
    const label = <DisplayFormatInnerRowLabel row={row} />;

    return outer ? (
        <Translation
            id="TR_DISPLAY_FORMAT_SUBCALL_FIELD"
            values={{ subcall: <SubcallName index={outer.index} />, label }}
        />
    ) : (
        label
    );
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
                        label={
                            <Text intent="neutral">
                                <DisplayFormatRowLabel row={row} />
                            </Text>
                        }
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
