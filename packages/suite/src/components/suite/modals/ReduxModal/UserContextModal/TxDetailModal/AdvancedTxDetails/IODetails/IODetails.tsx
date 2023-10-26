import { ReactElement, ReactNode } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { Elevation, spacingsPx, spacings, typography } from '@trezor/theme';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatAmount, formatNetworkAmount, isNftTokenTransfer } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { AnonymitySet, TokenTransfer } from '@trezor/blockchain-link';
import { Icon, CollapsibleBox, useElevation, Divider } from '@trezor/components';
import { UtxoAnonymity } from 'src/components/wallet';
import { AnalyzeInExplorerBanner } from './AnalyzeInExplorerBanner';
import { FormattedNftAmount } from 'src/components/suite/FormattedNftAmount';
import { IOAddress } from '../../IOAddress';
import { NetworkSymbol } from '@suite-common/wallet-config';

export const blurFix = css`
    margin-left: -10px;
    margin-right: -10px;
    padding-left: 10px;
    padding-right: 10px;
`;

const Wrapper = styled.div`
    text-align: left;
    overflow: auto;
    ${blurFix}
`;

const StyledCollapsibleBox = styled(CollapsibleBox)<{ $elevation: Elevation }>`
    overflow: auto;

    ${CollapsibleBox.Header} {
        padding: ${spacingsPx.md} 0;
    }

    ${CollapsibleBox.Content} {
        border: none;
        padding-bottom: ${spacingsPx.md};
    }
`;

const Grid = styled.div`
    display: grid;
    gap: ${spacingsPx.sm} 1%;
    grid-template-columns: 46% 6% 46%; /* address > address */
    ${blurFix}
`;

const RowGrid = styled(Grid)`
    padding-bottom: ${spacingsPx.xs};
`;

const GridItem = styled.div<{ $isAccountOwned?: boolean }>`
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    max-width: 290px;

    & + & {
        margin-top: ${spacingsPx.xs};
    }
`;

const IOGridItem = styled(GridItem)`
    & + & {
        margin-top: 0;
    }
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const RowGridItem = styled(GridItem)`
    padding-bottom: initial;

    & + & {
        margin-top: 0;
    }
`;

const GridGroupHeading = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    margin-bottom: ${spacingsPx.xs};
`;

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)`
    color: ${({ theme }) => theme.textSubdued};
    margin-top: ${spacingsPx.xxs};
    display: block;
`;

const StyledFormattedNftAmount = styled(FormattedNftAmount)`
    color: ${({ theme }) => theme.textSubdued};
    margin-top: ${spacingsPx.xxs};
`;

const GridGroup = styled.div`
    &:not(:last-of-type) {
        margin-bottom: ${spacingsPx.lg};
    }
`;

const AmountRow = styled.div`
    display: flex;
    align-items: center;
    margin-top: ${spacingsPx.xxs};
    gap: ${spacingsPx.xs};

    ${StyledFormattedCryptoAmount} {
        margin-top: 0;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
`;

interface IOGridRow {
    anonymitySet?: AnonymitySet;
    tx: WalletAccountTransaction;
    vinvout: WalletAccountTransaction['details']['vin'][number];
    isPhishingTransaction?: boolean;
}

const IOGridRow = ({
    anonymitySet,
    tx: { symbol },
    vinvout: { isAccountOwned, addresses, value },
    isPhishingTransaction,
}: IOGridRow) => {
    const network = useSelector(state => state.wallet.selectedAccount.network);
    const anonymity = addresses?.length && anonymitySet?.[addresses[0]];

    return (
        <GridItem $isAccountOwned={isAccountOwned}>
            <IOAddress
                txAddress={addresses?.length ? addresses[0] : ''}
                explorerUrl={network?.explorer.address}
                explorerUrlQueryString={network?.explorer.queryString}
                shouldAllowCopy={!isPhishingTransaction}
            />

            <br />

            <AmountRow>
                {anonymity && <UtxoAnonymity anonymity={anonymity} />}
                {value && (
                    <StyledFormattedCryptoAmount
                        value={formatNetworkAmount(value, symbol)}
                        symbol={symbol}
                    />
                )}
            </AmountRow>
        </GridItem>
    );
};

interface GridGroupWrapperProps {
    heading?: ReactNode;
    inputsLength?: number;
    outputsLength?: number;
    children: ReactElement | ReactElement[];
}

const IOGridGroupWrapper = ({
    heading,
    inputsLength,
    outputsLength,
    children,
}: GridGroupWrapperProps) => (
    <GridGroup>
        {heading ? <GridGroupHeading>{heading}:</GridGroupHeading> : null}
        {inputsLength !== undefined && outputsLength !== undefined ? (
            <RowGrid>
                <IOGridItem>
                    <Translation id="TR_INPUTS" />
                    {inputsLength >= 0 ? ` • ${inputsLength}` : null}
                </IOGridItem>
                <IOGridItem />
                <IOGridItem>
                    <Translation id="TR_OUTPUTS" />
                    {outputsLength >= 0 ? ` • ${outputsLength}` : null}
                </IOGridItem>
            </RowGrid>
        ) : null}
        {children}
    </GridGroup>
);

interface GridRowGroupComponentProps {
    from?: string;
    to?: string;
    symbol?: NetworkSymbol;
    amount?: string | ReactNode;
    isPhishingTransaction?: boolean;
}

const GridRowGroupComponent = ({
    from,
    to,
    symbol,
    amount,
    isPhishingTransaction,
}: GridRowGroupComponentProps) => {
    const theme = useTheme();
    const network = useSelector(state => state.wallet.selectedAccount.network);

    return (
        <RowGrid>
            <RowGridItem>
                <IOAddress
                    txAddress={from}
                    explorerUrl={network?.explorer.address}
                    explorerUrlQueryString={network?.explorer.queryString}
                    shouldAllowCopy={!isPhishingTransaction}
                />
                <br />
                {typeof amount === 'string' ? (
                    <StyledFormattedCryptoAmount value={amount} symbol={symbol} />
                ) : (
                    amount
                )}
            </RowGridItem>
            <IconWrapper>
                <Icon icon="ARROW_RIGHT" size={17} color={theme.TYPE_LIGHT_GREY} />
            </IconWrapper>
            <RowGridItem>
                <IOAddress
                    txAddress={to}
                    explorerUrl={network?.explorer.address}
                    explorerUrlQueryString={network?.explorer.queryString}
                    shouldAllowCopy={!isPhishingTransaction}
                />
            </RowGridItem>
        </RowGrid>
    );
};

interface TokensByStandard {
    [key: string]: TokenTransfer[];
}

interface EthereumSpecificBalanceDetailsRowProps {
    tx: WalletAccountTransaction;
    isPhishingTransaction?: boolean;
}

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
                <GridGroup>
                    <IOGridGroupWrapper heading={<Translation id="TR_INTERNAL_TRANSACTIONS" />}>
                        {tx.internalTransfers.map((transfer, index) => (
                            <GridRowGroupComponent
                                key={index}
                                from={transfer.from}
                                to={transfer.to}
                                amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                symbol={tx.symbol}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </IOGridGroupWrapper>
                </GridGroup>
            ) : null}

            {Object.entries(tokensByStandard).map(([key, tokens]) => (
                <GridGroup key={key}>
                    <IOGridGroupWrapper
                        heading={
                            <Translation
                                id="TR_TOKEN_TRANSFERS"
                                values={{ standard: key.toUpperCase() }}
                            />
                        }
                    >
                        {tokens.map((transfer, index) => (
                            <GridRowGroupComponent
                                key={index}
                                from={transfer.from}
                                to={transfer.to}
                                amount={
                                    isNftTokenTransfer(transfer) ? (
                                        <StyledFormattedNftAmount transfer={transfer} isWithLink />
                                    ) : (
                                        formatAmount(transfer.amount, transfer.decimals)
                                    )
                                }
                                symbol={transfer.symbol as NetworkSymbol}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </IOGridGroupWrapper>
                </GridGroup>
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

    return (
        <>
            {tokens.map((transfer, index) => (
                <GridRowGroupComponent
                    key={index}
                    from={transfer.from}
                    to={transfer.to}
                    amount={formatAmount(transfer.amount, transfer.decimals)}
                    symbol={transfer.symbol as NetworkSymbol}
                    isPhishingTransaction={isPhishingTransaction}
                />
            ))}
        </>
    );
};

interface BalanceDetailsRowProps {
    tx: WalletAccountTransaction;
    isPhishingTransaction?: boolean;
}

const BalanceDetailsRow = ({ tx, isPhishingTransaction }: BalanceDetailsRowProps) => {
    const vout = tx?.details?.vout[0];
    const vin = tx?.details?.vin[0];
    const value = formatNetworkAmount(vin.value || vout.value || '', tx.symbol);

    if (!(vout.addresses?.[0] && vin.addresses?.[0])) {
        return null;
    }

    return (
        <GridGroup>
            <IOGridGroupWrapper inputsLength={-1} outputsLength={-1}>
                <GridRowGroupComponent
                    from={vin.addresses[0]}
                    to={vout.addresses[0]}
                    amount={value}
                    symbol={tx.symbol}
                    isPhishingTransaction={isPhishingTransaction}
                />
            </IOGridGroupWrapper>
        </GridGroup>
    );
};

type IOSectionColumnProps = {
    tx: WalletAccountTransaction;
    inputs: WalletAccountTransaction['details']['vin'][number][];
    outputs: WalletAccountTransaction['details']['vin'][number][];
    isPhishingTransaction?: boolean;
};

const IOSectionColumn = ({ tx, inputs, outputs, isPhishingTransaction }: IOSectionColumnProps) => {
    const theme = useTheme();

    const { selectedAccount } = useSelector(state => state.wallet);

    const anonymitySet = selectedAccount?.account?.addresses?.anonymitySet;
    const hasInputs = !!inputs?.length;
    const hasOutputs = !!outputs?.length;

    return (
        <IOGridGroupWrapper inputsLength={inputs?.length} outputsLength={outputs?.length}>
            <Grid>
                {hasInputs && (
                    <div>
                        {inputs.map(input => (
                            <IOGridRow
                                key={`input-${input.n}`}
                                anonymitySet={anonymitySet}
                                tx={tx}
                                vinvout={input}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </div>
                )}
                <IconWrapper>
                    <Icon icon="ARROW_RIGHT" size={17} color={theme.TYPE_LIGHT_GREY} />
                </IconWrapper>
                {hasOutputs && (
                    <div>
                        {outputs.map(output => (
                            <IOGridRow
                                key={`output-${output.n}`}
                                anonymitySet={anonymitySet}
                                tx={tx}
                                vinvout={output}
                                isPhishingTransaction={isPhishingTransaction}
                            />
                        ))}
                    </div>
                )}
            </Grid>
        </IOGridGroupWrapper>
    );
};

type CollapsibleIOSectionProps = IOSectionColumnProps & {
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
    const { elevation } = useElevation();

    return inputs?.length || outputs?.length ? (
        <StyledCollapsibleBox
            $elevation={elevation}
            heading={heading}
            defaultIsOpen={opened}
            paddingType="none"
            fillType="none"
            hasDivider={false}
        >
            <IOSectionColumn
                tx={tx}
                inputs={inputs}
                outputs={outputs}
                isPhishingTransaction={isPhishingTransaction}
            />
        </StyledCollapsibleBox>
    ) : null;
};

interface IODetailsProps {
    tx: WalletAccountTransaction;
    isPhishingTransaction: boolean;
}

// Not ready for Cardano tokens, they will not be visible, probably
export const IODetails = ({ tx, isPhishingTransaction }: IODetailsProps) => {
    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;

    if (network?.networkType === 'ethereum') {
        return (
            <Wrapper>
                <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
                <BalanceDetailsRow tx={tx} isPhishingTransaction={isPhishingTransaction} />
                <EthereumSpecificBalanceDetailsRow
                    tx={tx}
                    isPhishingTransaction={isPhishingTransaction}
                />
            </Wrapper>
        );
    }

    if (network?.networkType === 'solana') {
        return (
            <Wrapper>
                <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
                <IOSectionColumn
                    tx={tx}
                    inputs={tx.details.vin}
                    outputs={tx.details.vout}
                    isPhishingTransaction={isPhishingTransaction}
                />
                <SolanaSpecificBalanceDetailsRow
                    tx={tx}
                    isPhishingTransaction={isPhishingTransaction}
                />
            </Wrapper>
        );
    }

    if (tx.type === 'joint') {
        return (
            <Wrapper>
                <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
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
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <AnalyzeInExplorerBanner txid={tx.txid} symbol={tx.symbol} />
            <IOSectionColumn tx={tx} inputs={tx.details.vin} outputs={tx.details.vout} />
        </Wrapper>
    );
};
