import { forwardRef, ReactNode } from 'react';
import styled from 'styled-components';

import { Truncate, variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Network, Account, NetworkSymbol } from 'src/types/wallet';
import { TokenInfo } from '@trezor/connect';
import { amountToSatoshi } from '@suite-common/wallet-utils';
import { zIndices } from '@trezor/theme';

const OutputWrapper = styled.div`
    display: flex;
    padding: 0 20px 0 0;
    margin-top: 32px;
    &:first-child {
        margin-top: 0;
    }
`;

const OutputHeadline = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 6px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    word-break: break-word;
`;

const OutputValue = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    display: flex;
    flex-wrap: wrap;
`;

const OutputLeft = styled.div`
    display: flex;
    width: 30px;
    justify-content: center;
    flex-direction: column;
`;

const MultiIndicatorWrapper = styled.div<{ linesCount: number }>`
    display: flex;
    align-self: flex-start;
    height: ${({ linesCount }) => linesCount * 80}px;
    align-items: center;
    position: relative;
    z-index: ${zIndices.base};
    &:after {
        z-index: -2;
        width: 10px;
        left: 10px;
        position: absolute;
        height: 100%;
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
        border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
        border-left: 1px solid ${({ theme }) => theme.STROKE_GREY};
        content: '';
        display: block;
    }
    &:before {
        z-index: -1;
        width: 20px;
        background: ${({ theme }) => theme.BG_WHITE};
        position: absolute;
        height: 50%;
        content: '';
        display: block;
    }
`;

const OutputRight = styled.div`
    flex: 1;
    text-align: left;
`;

const CardanoTrezorAmountWrapper = styled.div`
    margin-top: 10px;
`;

const OutputRightLine = styled.div`
    & + & {
        margin-top: 37px;
    }
`;

const OutputValueWrapper = styled.div`
    display: inline-block;
    overflow: hidden;
    word-break: break-word;
`;

const DotSeparatorWrapper = styled.div`
    margin: 7px 7px 0;
    width: 8px;
    display: inline-flex;
    align-items: center;
    flex-direction: column;
`;

const DotSeparator = styled.div`
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const TruncateWrapper = ({ condition, children }: { condition: boolean; children?: ReactNode }) =>
    condition ? <Truncate>{children}</Truncate> : <>{children}</>;

// token name is fingerprint in Cardano
const getFingerprint = (
    tokens: Account['tokens'],
    symbol: string | undefined,
): string | undefined => {
    if (!tokens) {
        return undefined;
    }

    const token = tokens.find(token => token.symbol?.toLowerCase() === symbol?.toLowerCase());

    return token?.name;
};

export type OutputElementLine = {
    id: string;
    label: ReactNode;
    value: string;
    plainValue?: boolean;
};

export type TransactionReviewOutputElementProps = {
    indicator?: JSX.Element;
    lines: OutputElementLine[];
    cryptoSymbol?: NetworkSymbol;
    fiatSymbol: Network['symbol'];
    hasExpansion?: boolean;
    fiatVisible?: boolean;
    token?: TokenInfo;
    account: Account;
};

export const TransactionReviewOutputElement = forwardRef<
    HTMLDivElement,
    TransactionReviewOutputElementProps
>(
    (
        {
            indicator,
            lines,
            token,
            cryptoSymbol,
            fiatSymbol,
            hasExpansion = false,
            fiatVisible = false,
            account,
        },
        ref,
    ) => {
        const { tokens, networkType } = account;
        const cardanoFingerprint = getFingerprint(tokens, token?.symbol);

        return (
            <OutputWrapper ref={ref}>
                <OutputLeft>
                    {lines.length > 1 ? (
                        <MultiIndicatorWrapper linesCount={lines.length - 1}>
                            {indicator}
                        </MultiIndicatorWrapper>
                    ) : (
                        <>{indicator}</>
                    )}
                </OutputLeft>
                <OutputRight>
                    {lines.map(line => (
                        <OutputRightLine key={line.id}>
                            <OutputHeadline>
                                <Truncate>{line.label}</Truncate>
                            </OutputHeadline>
                            <OutputValue>
                                <TruncateWrapper condition={hasExpansion}>
                                    <OutputValueWrapper>
                                        {line.plainValue ? (
                                            line.value
                                        ) : (
                                            <FormattedCryptoAmount
                                                disableHiddenPlaceholder
                                                value={line.value}
                                                symbol={cryptoSymbol}
                                            />
                                        )}
                                    </OutputValueWrapper>
                                    {fiatVisible && (
                                        <>
                                            <DotSeparatorWrapper>
                                                <DotSeparator />
                                            </DotSeparatorWrapper>
                                            <OutputValueWrapper>
                                                <FiatValue
                                                    disableHiddenPlaceholder
                                                    amount={line.value}
                                                    symbol={fiatSymbol}
                                                />
                                            </OutputValueWrapper>
                                        </>
                                    )}
                                </TruncateWrapper>
                            </OutputValue>
                            {networkType === 'cardano' && cardanoFingerprint && (
                                <CardanoTrezorAmountWrapper>
                                    <OutputHeadline>
                                        <Translation id="TR_CARDANO_FINGERPRINT_HEADLINE" />
                                    </OutputHeadline>
                                    <OutputValue>{cardanoFingerprint}</OutputValue>
                                </CardanoTrezorAmountWrapper>
                            )}
                            {networkType === 'cardano' && token && token.decimals !== 0 && (
                                <CardanoTrezorAmountWrapper>
                                    <OutputHeadline>
                                        <Translation id="TR_CARDANO_TREZOR_AMOUNT_HEADLINE" />
                                    </OutputHeadline>
                                    <OutputValue>
                                        {amountToSatoshi(line.value, token.decimals)}
                                    </OutputValue>
                                </CardanoTrezorAmountWrapper>
                            )}
                        </OutputRightLine>
                    ))}
                </OutputRight>
            </OutputWrapper>
        );
    },
);
