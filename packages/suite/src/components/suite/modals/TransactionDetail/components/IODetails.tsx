import React, { ReactElement, ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatAmount, formatNetworkAmount, isNftTokenTransfer } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { AnonymitySet, TokenTransfer } from '@trezor/blockchain-link';
import { Icon, useTheme, variables, CollapsibleBox } from '@trezor/components';
import { UtxoAnonymity } from 'src/components/wallet';
import { IOAddress } from './IOAddress';
import { AnalyzeInBlockbookBanner } from './AnalyzeInBlockbookBanner';
import { FormattedNftAmount } from 'src/components/suite/FormattedNftAmount';
import { useExplorerTxUrl } from 'src/hooks/suite/useExplorerTxUrl';

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

const StyledCollapsibleBox = styled(CollapsibleBox)`
    background: none;
    box-shadow: none;
    border-radius: 0;
    margin-bottom: 0;
    padding-bottom: 16px;
    text-align: left;
    overflow: auto;
    ${blurFix}

    & + & {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
        padding-top: 16px;
    }

    ${CollapsibleBox.Header} {
        padding: 16px 0;
        border-radius: 12px;
        ${blurFix}

        :hover {
            background-color: ${({ theme }) => theme.BG_GREY};
        }
    }

    ${CollapsibleBox.Heading} {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
        font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    }

    ${CollapsibleBox.Content} {
        padding: 8px 0 0 0;
        border: none;
    }
`;

const Grid = styled.div`
    display: grid;
    gap: 12px 1%;
    grid-template-columns: 46% 6% 46%; /* address > address */
    ${blurFix}
`;

const RowGrid = styled(Grid)`
    padding-bottom: 10px;
`;

const GridItem = styled.div<{ isAccountOwned?: boolean }>`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    max-width: 290px;

    & + & {
        margin-top: 10px;
    }
`;

const IOGridItem = styled(GridItem)`
    & + & {
        margin-top: 0;
    }
    color: ${({ theme }) => theme.BG_GREEN};
`;

const RowGridItem = styled(GridItem)`
    padding-bottom: initial;

    & + & {
        margin-top: 0;
    }
`;

const GridGroupHeading = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-bottom: 10px;
`;

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-top: 4px;
    display: block;
`;

const StyledFormattedNftAmount = styled(FormattedNftAmount)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-top: 4px;
`;

const GridGroup = styled.div`
    &:not(:last-of-type) {
        margin-bottom: 22px;
    }
`;

const AmountRow = styled.div`
    display: flex;
    align-items: center;
    margin-top: 4px;
    gap: 10px;

    ${StyledFormattedCryptoAmount} {
        margin-top: 0px;
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
}

const IOGridRow = ({
    anonymitySet,
    tx: { symbol },
    vinvout: { isAccountOwned, addresses, value },
}: IOGridRow) => {
    const anonymity = addresses?.length && anonymitySet?.[addresses[0]];

    const explorerTxUrl = useExplorerTxUrl();

    return (
        <GridItem isAccountOwned={isAccountOwned}>
            <IOAddress
                txAddress={addresses?.length ? addresses[0] : ''}
                explorerUrl={explorerTxUrl}
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
    heading?: React.ReactNode;
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
    symbol: string;
    amount?: string | ReactNode;
}

const GridRowGroupComponent = ({ from, to, symbol, amount }: GridRowGroupComponentProps) => {
    const theme = useTheme();
    const explorerTxUrl = useExplorerTxUrl();

    return (
        <RowGrid>
            <RowGridItem>
                <IOAddress txAddress={from} explorerUrl={explorerTxUrl} />
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
                <IOAddress txAddress={to} explorerUrl={explorerTxUrl} />
            </RowGridItem>
        </RowGrid>
    );
};

interface TokensByStandard {
    [key: string]: TokenTransfer[];
}

interface EthereumSpecificBalanceDetailsRowProps {
    tx: WalletAccountTransaction;
}

const EthereumSpecificBalanceDetailsRow = ({ tx }: EthereumSpecificBalanceDetailsRowProps) => {
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
                                // eslint-disable-next-line react/no-array-index-key
                                key={index}
                                from={transfer.from}
                                to={transfer.to}
                                amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                symbol={tx.symbol}
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
                                // eslint-disable-next-line react/no-array-index-key
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
                                symbol={transfer.symbol}
                            />
                        ))}
                    </IOGridGroupWrapper>
                </GridGroup>
            ))}
        </>
    );
};

interface BalanceDetailsRowProps {
    tx: WalletAccountTransaction;
}

const BalanceDetailsRow = ({ tx }: BalanceDetailsRowProps) => {
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
                />
            </IOGridGroupWrapper>
        </GridGroup>
    );
};

type IOSectionColumnProps = {
    tx: WalletAccountTransaction;
    inputs: WalletAccountTransaction['details']['vin'][number][];
    outputs: WalletAccountTransaction['details']['vin'][number][];
};

const IOSectionColumn = ({ tx, inputs, outputs }: IOSectionColumnProps) => {
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
                                key={input.n}
                                anonymitySet={anonymitySet}
                                tx={tx}
                                vinvout={input}
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
                                key={output.n}
                                anonymitySet={anonymitySet}
                                tx={tx}
                                vinvout={output}
                            />
                        ))}
                    </div>
                )}
            </Grid>
        </IOGridGroupWrapper>
    );
};

type CollapsibleIOSectionProps = IOSectionColumnProps & {
    heading?: React.ReactNode;
    opened?: boolean;
};

const CollapsibleIOSection = ({
    tx,
    inputs,
    outputs,
    heading,
    opened,
}: CollapsibleIOSectionProps) =>
    inputs?.length || outputs?.length ? (
        <StyledCollapsibleBox heading={heading} isOpen={opened} variant="large">
            <IOSectionColumn tx={tx} inputs={inputs} outputs={outputs} />
        </StyledCollapsibleBox>
    ) : null;

interface IODetailsProps {
    tx: WalletAccountTransaction;
}

// Not ready for Cardano tokens, they will not be visible, probably
export const IODetails = ({ tx }: IODetailsProps) => {
    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;

    if (network?.networkType === 'ethereum') {
        return (
            <Wrapper>
                <AnalyzeInBlockbookBanner txid={tx.txid} />
                <BalanceDetailsRow tx={tx} />
                <EthereumSpecificBalanceDetailsRow tx={tx} />
            </Wrapper>
        );
    }

    if (tx.type === 'joint') {
        return (
            <Wrapper>
                <AnalyzeInBlockbookBanner txid={tx.txid} />
                <CollapsibleIOSection
                    heading={<Translation id="TR_MY_INPUTS_AND_OUTPUTS" />}
                    opened
                    tx={tx}
                    inputs={tx.details.vin?.filter(vin => vin.isAccountOwned)}
                    outputs={tx.details.vout?.filter(vout => vout.isAccountOwned)}
                />
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
            <AnalyzeInBlockbookBanner txid={tx.txid} />
            <IOSectionColumn tx={tx} inputs={tx.details.vin} outputs={tx.details.vout} />
        </Wrapper>
    );
};
