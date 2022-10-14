import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, useTheme, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, HiddenPlaceholder, Translation } from '@suite-components';

export const blurFix = css`
    margin-left: -10px;
    margin-right: -10px;
    padding-left: 10px;
    padding-right: 10px;
`;

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
    overflow: auto;
    ${blurFix}
`;

const IconWrapper = styled.div`
    display: flex;
    justify-self: left;
    width: 100%;
    margin-top: 14px;
    margin-bottom: 16px;
`;

const IOGridTitle = styled.div`
    margin-bottom: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
`;

const IOGrid = styled.div`
    display: grid;
    gap: 0 16px;
    line-height: 1.9;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    grid-template-columns: auto auto auto; /* address, extra, amount */
    ${blurFix}
`;

const IOGridCell = styled.div<{ isAccountOwned?: boolean }>`
    white-space: nowrap;
    overflow: hidden;
    ${blurFix}

    ${({ theme, isAccountOwned }) =>
        isAccountOwned &&
        css`
            color: ${theme.TYPE_DARK_GREY};
        `}

    :nth-child(3n + 1) {
        /* address */
        text-overflow: ellipsis;
    }

    :nth-child(3n + 2) {
        /* extra */
    }

    :nth-child(3n + 3) {
        /* amount */
        text-align: right;
    }
`;

type EnhancedVinVout = WalletAccountTransaction['details']['vin'][number];

const IOGridRow = ({
    tx: { symbol },
    vinvout: { isAccountOwned, addresses, value },
}: {
    tx: WalletAccountTransaction;
    vinvout: EnhancedVinVout;
}) => (
    <>
        <IOGridCell isAccountOwned={isAccountOwned}>
            <HiddenPlaceholder>{addresses}</HiddenPlaceholder>
        </IOGridCell>
        <IOGridCell isAccountOwned={isAccountOwned} />
        <IOGridCell isAccountOwned={isAccountOwned}>
            {value && (
                <FormattedCryptoAmount value={formatNetworkAmount(value, symbol)} symbol={symbol} />
            )}
        </IOGridCell>
    </>
);

type IOSectionProps = {
    tx: WalletAccountTransaction;
    inputs: EnhancedVinVout[];
    outputs: EnhancedVinVout[];
};

const IOSection = ({ tx, inputs, outputs }: IOSectionProps) => {
    const theme = useTheme();
    const hasInputs = !!inputs?.length;
    const hasOutputs = !!outputs?.length;
    return (
        <>
            {hasInputs && (
                <IOGridTitle>
                    <Translation id="TR_INPUTS" />
                </IOGridTitle>
            )}
            {hasInputs && (
                <IOGrid>
                    {inputs.map(input => (
                        <IOGridRow key={input.n} tx={tx} vinvout={input} />
                    ))}
                </IOGrid>
            )}
            {hasInputs && hasOutputs && (
                <IconWrapper>
                    <Icon icon="ARROW_DOWN" size={17} color={theme.TYPE_LIGHT_GREY} />
                </IconWrapper>
            )}
            {hasOutputs && (
                <IOGridTitle>
                    <Translation id="TR_OUTPUTS" />
                </IOGridTitle>
            )}
            {hasOutputs && (
                <IOGrid>
                    {outputs.map(output => (
                        <IOGridRow key={output.n} tx={tx} vinvout={output} />
                    ))}
                </IOGrid>
            )}
        </>
    );
};

interface IODetailsProps {
    tx: WalletAccountTransaction;
}

export const IODetails = ({ tx }: IODetailsProps) => (
    <Wrapper>
        <IOSection tx={tx} inputs={tx.details.vin} outputs={tx.details.vout} />
    </Wrapper>
);
