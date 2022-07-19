import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, HiddenPlaceholder, Translation } from '@suite-components';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const IOWrapper = styled.div`
    overflow: auto;
`;

const IconWrapper = styled.div`
    display: flex;
    justify-self: left;
    width: 100%;
    margin-top: 14px;
    margin-bottom: 16px;
`;

const IORowTitle = styled.div`
    margin-bottom: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
`;

const IORow = styled.div`
    display: flex;
    line-height: 1.9;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
`;

const CryptoAmountWrapper = styled.div`
    flex: 0 0 auto;
`;

const Circle = styled.div`
    display: inline-flex;
    margin-left: 5px;
    margin-right: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface IODetailsProps {
    tx: WalletAccountTransaction;
}

export const IODetails = ({ tx }: IODetailsProps) => {
    const theme = useTheme();
    const network = getNetwork(tx.symbol);

    return (
        <Wrapper>
            {tx.details.vin && tx.details.vout && (
                <IOWrapper>
                    <div>
                        <IORowTitle>
                            <Translation id="TR_INPUTS" />
                        </IORowTitle>

                        {tx.details.vin.map(input => (
                            <IORow key={input.n}>
                                {network?.networkType !== 'ethereum' && (
                                    // don't show input amount in ethereum
                                    // consider faking it by showing the same value os the output
                                    <CryptoAmountWrapper>
                                        <FormattedCryptoAmount
                                            value={input.value}
                                            symbol={tx.symbol}
                                        />
                                        <Circle>&bull;</Circle>
                                    </CryptoAmountWrapper>
                                )}
                                <HiddenPlaceholder>{input.addresses}</HiddenPlaceholder>
                            </IORow>
                        ))}
                    </div>

                    <IconWrapper>
                        <Icon icon="ARROW_DOWN" size={17} color={theme.TYPE_LIGHT_GREY} />
                    </IconWrapper>

                    <div>
                        <IORowTitle>
                            <Translation id="TR_OUTPUTS" />
                        </IORowTitle>
                        {tx.details.vout.map(output => (
                            <IORow key={output.n}>
                                <CryptoAmountWrapper>
                                    <FormattedCryptoAmount
                                        value={output.value}
                                        symbol={tx.symbol}
                                    />
                                    <Circle>&bull;</Circle>
                                </CryptoAmountWrapper>
                                <HiddenPlaceholder>{output.addresses}</HiddenPlaceholder>
                            </IORow>
                        ))}
                    </div>
                </IOWrapper>
            )}
        </Wrapper>
    );
};
