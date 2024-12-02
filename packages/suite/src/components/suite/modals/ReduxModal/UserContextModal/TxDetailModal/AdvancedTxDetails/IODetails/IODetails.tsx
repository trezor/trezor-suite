import { ReactNode } from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatAmount, formatNetworkAmount, isNftTokenTransfer } from '@suite-common/wallet-utils';
import { AnonymitySet, TokenTransfer } from '@trezor/blockchain-link';
import {
    Icon,
    CollapsibleBox,
    Divider,
    Column,
    Row,
    Text,
    Grid,
    InfoSegments,
    H4,
} from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { FormattedCryptoAmount, FormattedNftAmount, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { UtxoAnonymity } from 'src/components/wallet';
import { IOAddress } from 'src/components/suite/copy/IOAddress';

import { AnalyzeInExplorerBanner } from './AnalyzeInExplorerBanner';

const GridWrapper = styled.div`
    position: relative;
`;

const IconWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
`;

type IODetails = WalletAccountTransaction['details']['vin'][number];

type IOItem = {
    anonymitySet?: AnonymitySet;
    symbol?: NetworkSymbol;
    address?: string;
    amount?: string | ReactNode;
    isPhishingTransaction?: boolean;
};

const IOItem = ({ anonymitySet, address, symbol, amount, isPhishingTransaction }: IOItem) => {
    const network = useSelector(state => state.wallet.selectedAccount.network);
    const anonymity = address && anonymitySet?.[address];

    return (
        <Column>
            <IOAddress
                txAddress={address ?? ''}
                explorerUrl={network?.explorer.address}
                explorerUrlQueryString={network?.explorer.queryString}
                shouldAllowCopy={!isPhishingTransaction}
            />
            <Text as="div" variant="tertiary" typographyStyle="label">
                <Row gap={spacings.xs}>
                    {anonymity && <UtxoAnonymity anonymity={anonymity} />}
                    {amount &&
                        (typeof amount === 'string' && symbol ? (
                            <FormattedCryptoAmount
                                value={formatNetworkAmount(amount, symbol)}
                                symbol={symbol}
                            />
                        ) : (
                            amount
                        ))}
                </Row>
            </Text>
        </Column>
    );
};

type IOGroupProps = {
    tx: WalletAccountTransaction;
    inputs: IODetails[];
    outputs: IODetails[];
    isPhishingTransaction?: boolean;
};

const IOGroup = ({ tx, inputs, outputs, isPhishingTransaction }: IOGroupProps) => {
    const { selectedAccount } = useSelector(state => state.wallet);

    const anonymitySet = selectedAccount?.account?.addresses?.anonymitySet;
    const hasInputs = !!inputs?.length;
    const hasOutputs = !!outputs?.length;

    if (!hasInputs && !hasOutputs) return null;

    return (
        <GridWrapper>
            <IconWrapper>
                <Icon name="arrowRight" size="medium" variant="tertiary" />
            </IconWrapper>
            <Grid columns={2} gap={spacings.xxxxl}>
                {hasInputs && (
                    <Column gap={spacings.xs} margin={{ right: spacings.xl }}>
                        <InfoSegments typographyStyle="hint" variant="tertiary">
                            <Text typographyStyle="callout" variant="default">
                                <Translation id="TR_INPUTS" />
                            </Text>
                            {inputs.length}
                        </InfoSegments>

                        {inputs.map(input => (
                            <IOItem
                                key={`input-${input.n}`}
                                anonymitySet={anonymitySet}
                                symbol={tx.symbol}
                                address={input.addresses?.[0]}
                                amount={input.value}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </Column>
                )}
                {hasOutputs && (
                    <Column gap={spacings.xs} margin={{ left: spacings.xl }}>
                        <InfoSegments typographyStyle="hint" variant="tertiary">
                            <Text typographyStyle="callout" variant="default">
                                <Translation id="TR_OUTPUTS" />
                            </Text>
                            {outputs.length}
                        </InfoSegments>
                        {outputs.map(output => (
                            <IOItem
                                key={`output-${output.n}`}
                                anonymitySet={anonymitySet}
                                symbol={tx.symbol}
                                address={output.addresses?.[0]}
                                amount={output.value}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </Column>
                )}
            </Grid>
        </GridWrapper>
    );
};

type TokensByStandard = {
    [key: string]: TokenTransfer[];
};

type EthereumSpecificBalanceDetailsRowProps = {
    tx: WalletAccountTransaction;
    isPhishingTransaction?: boolean;
};

const EthereumSpecificBalanceDetailsRow = ({
    tx,
    isPhishingTransaction,
}: EthereumSpecificBalanceDetailsRowProps) => {
    const tokensByStandard: TokensByStandard = tx.tokens.reduce(
        (acc: TokensByStandard, value: TokenTransfer) => {
            const { standard } = value;

            if (!standard) return acc;

            if (!acc[standard]) {
                acc[standard] = [];
            }

            acc[standard].push(value);

            return acc;
        },
        {},
    );

    return (
        <>
            {tx.internalTransfers?.length ? (
                <Column gap={spacings.xs}>
                    <H4>
                        <Translation id="TR_INTERNAL_TRANSACTIONS" />
                    </H4>
                    {tx.internalTransfers.map(({ from, to, amount }, index) => (
                        <IOGroup
                            key={index}
                            tx={tx}
                            inputs={[{ addresses: [from], value: amount }] as IODetails[]}
                            outputs={[{ addresses: [to], value: amount }] as IODetails[]}
                            isPhishingTransaction={isPhishingTransaction}
                        />
                    ))}
                </Column>
            ) : null}

            {Object.entries(tokensByStandard).map(([key, tokens]) => (
                <Column key={key} gap={spacings.xs}>
                    <H4>
                        <Translation
                            id="TR_TOKEN_TRANSFERS"
                            values={{ standard: key.toUpperCase() }}
                        />
                    </H4>
                    {tokens.map((transfer, index) => {
                        const value = isNftTokenTransfer(transfer) ? (
                            <FormattedNftAmount
                                transfer={transfer}
                                isWithLink
                                alignMultitoken="flex-start"
                            />
                        ) : (
                            formatAmount(transfer.amount, transfer.decimals)
                        );

                        return (
                            <IOGroup
                                key={index}
                                tx={{ ...tx, symbol: transfer.symbol as NetworkSymbol }}
                                inputs={[{ addresses: [transfer.from], value }] as IODetails[]}
                                outputs={[{ addresses: [transfer.to], value }] as IODetails[]}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        );
                    })}
                </Column>
            ))}
        </>
    );
};

type SolanaSpecificBalanceDetailsRowProps = {
    tx: WalletAccountTransaction;
    isPhishingTransaction?: boolean;
};

const SolanaSpecificBalanceDetailsRow = ({
    tx,
    isPhishingTransaction,
}: SolanaSpecificBalanceDetailsRowProps) => {
    const { tokens } = tx;

    return tokens.map(({ from, to, amount, decimals }, index) => (
        <IOGroup
            key={index}
            tx={tx}
            inputs={
                [
                    {
                        addresses: [from],
                        value: formatAmount(amount, decimals),
                    },
                ] as IODetails[]
            }
            outputs={
                [
                    {
                        addresses: [to],
                        value: formatAmount(amount, decimals),
                    },
                ] as IODetails[]
            }
            isPhishingTransaction={isPhishingTransaction}
        />
    ));
};

type CollapsibleIOSectionProps = IOGroupProps & {
    heading?: ReactNode;
    opened?: boolean;
};

const CollapsibleIOSection = ({
    tx,
    inputs,
    outputs,
    heading,
    opened,
    isPhishingTransaction,
}: CollapsibleIOSectionProps) => {
    return inputs?.length || outputs?.length ? (
        <CollapsibleBox
            heading={heading}
            defaultIsOpen={opened}
            paddingType="none"
            fillType="none"
            hasDivider={false}
        >
            <IOGroup
                tx={tx}
                inputs={inputs}
                outputs={outputs}
                isPhishingTransaction={isPhishingTransaction}
            />
        </CollapsibleBox>
    ) : null;
};

type IODetailsProps = {
    tx: WalletAccountTransaction;
    isPhishingTransaction: boolean;
};

// Not ready for Cardano tokens, they will not be visible, probably
export const IODetails = ({ tx, isPhishingTransaction }: IODetailsProps) => {
    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;

    const getContent = () => {
        if (network?.networkType === 'ethereum') {
            return (
                <>
                    <IOGroup
                        inputs={tx.details.vin}
                        outputs={tx.details.vout}
                        tx={tx}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                    <EthereumSpecificBalanceDetailsRow
                        tx={tx}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                </>
            );
        } else if (network?.networkType === 'solana') {
            return (
                <>
                    <IOGroup
                        tx={tx}
                        inputs={tx.details.vin}
                        outputs={tx.details.vout}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                    <SolanaSpecificBalanceDetailsRow
                        tx={tx}
                        isPhishingTransaction={isPhishingTransaction}
                    />
                </>
            );
        } else if (tx.type === 'joint') {
            return (
                <>
                    <CollapsibleIOSection
                        heading={<Translation id="TR_MY_INPUTS_AND_OUTPUTS" />}
                        opened
                        tx={tx}
                        inputs={tx.details.vin?.filter(vin => vin.isAccountOwned)}
                        outputs={tx.details.vout?.filter(vout => vout.isAccountOwned)}
                    />
                    <Divider margin={{ top: spacings.xs, bottom: spacings.xxs }} />
                    <CollapsibleIOSection
                        heading={<Translation id="TR_OTHER_INPUTS_AND_OUTPUTS" />}
                        tx={tx}
                        inputs={tx.details.vin?.filter(vin => !vin.isAccountOwned)}
                        outputs={tx.details.vout?.filter(vout => !vout.isAccountOwned)}
                    />
                </>
            );
        } else {
            return <IOGroup tx={tx} inputs={tx.details.vin} outputs={tx.details.vout} />;
        }
    };

    return (
        <Column gap={spacings.xxl}>
            <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
            <Column gap={spacings.lg}>{getContent()}</Column>
        </Column>
    );
};
