import React from 'react';
import styled from 'styled-components';
import { Truncate } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount } from '@suite-components';
import { Network } from '@wallet-types';

const OutputWrapper = styled.div`
    display: flex;
    padding: 0 20px 0 0;
    margin-top: 37px;
    &:first-child {
        margin-top: 0;
    }
`;

const OutputHeadline = styled.div`
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    word-break: break-word;
`;

const OutputValue = styled.div`
    font-size: 14px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;

    display: flex;
    flex-wrap: wrap;
`;

const OutputLeft = styled.div`
    display: flex;
    width: 50px;
    justify-content: center;
    flex-direction: column;
`;

const MultiIndicatorWrapper = styled.div<{ linesCount: number }>`
    display: flex;
    align-self: flex-start;
    height: ${props => props.linesCount * 80}px;
    align-items: center;
    position: relative;
    z-index: 1;
    &:after {
        z-index: -2;
        width: 10px;
        left: 10px;
        position: absolute;
        height: 100%;
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
        border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
        border-left: 1px solid ${props => props.theme.STROKE_GREY};
        content: '';
        display: block;
    }
    &:before {
        z-index: -1;
        width: 20px;
        background: ${props => props.theme.BG_WHITE};
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
    background: ${props => props.theme.TYPE_LIGHT_GREY};
`;

export type OutputElementLine = {
    id: string;
    label: React.ReactNode;
    value: string;
    plainValue?: boolean;
};

export type Props = {
    indicator?: JSX.Element;
    lines: OutputElementLine[];
    cryptoSymbol?: string;
    fiatSymbol: Network['symbol'];
    hasExpansion?: boolean;
    fiatVisible?: boolean;
};

const TruncateWrapper = ({
    condition,
    children,
}: {
    condition: boolean;
    children?: React.ReactNode;
}) => (condition ? <Truncate>{children}</Truncate> : <>{children}</>);

const OutputLine = ({
    indicator,
    lines,
    cryptoSymbol,
    fiatSymbol,
    hasExpansion = false,
    fiatVisible = false,
}: Props) => (
    <OutputWrapper>
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
                </OutputRightLine>
            ))}
        </OutputRight>
    </OutputWrapper>
);

export default OutputLine;
