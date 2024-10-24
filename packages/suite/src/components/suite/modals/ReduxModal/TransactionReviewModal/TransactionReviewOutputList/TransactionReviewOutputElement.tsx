import { forwardRef, ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenInfo } from '@trezor/connect';
import { formatAmountWithDecimals } from '@suite-common/wallet-utils';
import { TransactionReviewStepIndicatorProps } from './TransactionReviewStepIndicator';
import { zIndices } from '@trezor/theme';
import { DeviceDisplay } from '../../../../DeviceDisplay/DeviceDisplay';
import { DisplayMode } from 'src/types/suite';

const TYPES_TO_BE_DISPLAYED_IN_SCREEN_BOX = ['address', 'regular_legacy', 'data', 'opreturn'];

const OutputWrapper = styled.div`
    display: flex;
    margin-top: 32px;

    &:first-child {
        margin-top: 0;
    }
`;

const OutputHeadline = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 6px;
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    word-break: break-word;
`;

const OutputValue = styled.div`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    display: flex;
    flex-wrap: wrap;
`;

const OutputLeft = styled.div<{ $isCentered: boolean }>`
    display: flex;
    width: 30px;
    justify-content: ${({ $isCentered }) => ($isCentered ? 'center' : 'flex-start')};
    padding-top: ${({ $isCentered }) => ($isCentered ? undefined : '5px')};
    flex-direction: column;
`;

const MultiIndicatorWrapper = styled.div<{ $linesCount: number }>`
    display: flex;
    align-self: flex-start;
    height: ${({ $linesCount }) => $linesCount * 80}px;
    align-items: center;
    position: relative;
    z-index: ${zIndices.base};

    &::after {
        z-index: -2;
        width: 10px;
        left: 10px;
        position: absolute;
        height: 100%;
        border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
        border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
        border-left: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
        content: '';
        display: block;
    }

    &::before {
        z-index: -1;
        width: 20px;
        background: ${({ theme }) => theme.legacy.BG_WHITE};
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
    background: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

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
    confirmLabel?: ReactNode;
};

export type TransactionReviewOutputElementProps = {
    indicator?: JSX.Element;
    lines: OutputElementLine[];
    cryptoSymbol?: NetworkSymbol;
    fiatSymbol?: NetworkSymbol;
    fiatVisible?: boolean;
    token?: TokenInfo;
    account?: Account;
    state?: TransactionReviewStepIndicatorProps['state'];
    displayMode?: DisplayMode;
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
            fiatVisible = false,
            account,
            state,
            displayMode,
        },
        ref,
    ) => {
        const network = account?.networkType;
        const cardanoFingerprint = getFingerprint(account?.tokens, token?.symbol);
        const isActive = state === 'active';
        const hasMultipleLines = lines.length > 1;

        return (
            <OutputWrapper ref={ref}>
                <OutputLeft $isCentered={hasMultipleLines}>
                    {hasMultipleLines ? (
                        <MultiIndicatorWrapper $linesCount={lines.length - 1}>
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
                                {isActive && (line.id === 'address' || line.id === 'regular_legacy')
                                    ? line.confirmLabel
                                    : line.label}
                            </OutputHeadline>
                            <OutputValue>
                                {isActive &&
                                displayMode &&
                                TYPES_TO_BE_DISPLAYED_IN_SCREEN_BOX.includes(line.id) ? (
                                    <DeviceDisplay displayMode={displayMode} address={line.value} />
                                ) : (
                                    <OutputValueWrapper>
                                        {line.plainValue ? (
                                            line.value
                                        ) : (
                                            <FormattedCryptoAmount
                                                disableHiddenPlaceholder
                                                value={line.value}
                                                symbol={
                                                    // TX fee is so far always paid in network native coin
                                                    line.id !== 'fee' && token
                                                        ? token.symbol
                                                        : cryptoSymbol
                                                }
                                            />
                                        )}
                                    </OutputValueWrapper>
                                )}
                                {/* temporary solution until fiat value for ERC20 tokens will be fixed  */}
                                {fiatSymbol && fiatVisible && !(line.id !== 'fee' && token) && (
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
                            </OutputValue>
                            {network === 'cardano' && cardanoFingerprint && (
                                <CardanoTrezorAmountWrapper>
                                    <OutputHeadline>
                                        <Translation id="TR_CARDANO_FINGERPRINT_HEADLINE" />
                                    </OutputHeadline>
                                    <OutputValue>{cardanoFingerprint}</OutputValue>
                                </CardanoTrezorAmountWrapper>
                            )}
                            {network === 'cardano' && token && token.decimals !== 0 && (
                                <CardanoTrezorAmountWrapper>
                                    <OutputHeadline>
                                        <Translation id="TR_CARDANO_TREZOR_AMOUNT_HEADLINE" />
                                    </OutputHeadline>
                                    <OutputValue>
                                        {formatAmountWithDecimals(line.value, token.decimals)}
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
