import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { getNetwork } from '@wallet-utils/accountUtils';
import { FormattedCryptoAmount, Translation } from '@suite-components';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const IOWrapper = styled.div``;

const IconWrapper = styled.div`
    display: flex;
    justify-self: left;
    width: 100%;
    margin-top: 14px;
    margin-bottom: 16px;
`;

const IOBox = styled.div``;

const IORowTitle = styled.div`
    margin-bottom: 4px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
`;

const IORow = styled.div`
    display: flex;
    line-height: 1.9;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
`;

const CryptoAmountWrapper = styled.div`
    flex: 0 0 auto;
`;

const Address = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

const Circle = styled.div`
    display: inline-flex;
    margin-left: 5px;
    margin-right: 5px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    tx: WalletAccountTransaction;
}

const IODetails = ({ tx }: Props) => {
    const theme = useTheme();
    const network = getNetwork(tx.symbol);

    return (
        <Wrapper>
            {tx.details.vin && tx.details.vout && (
                <IOWrapper>
                    <IOBox>
                        <IORowTitle>
                            <Translation id="TR_INPUTS" />
                        </IORowTitle>

                        {tx.details.vin.map(input => {
                            return (
                                <IORow key={input.n}>
                                    {network?.networkType !== 'ethereum' && (
                                        // don't show input amount in ethereum
                                        // consider faking it by showing the same value os the output
                                        <CryptoAmountWrapper>
                                            <FormattedCryptoAmount
                                                value={input.value}
                                                symbol={tx.symbol}
                                                disableHiddenPlaceholder
                                            />
                                            <Circle>&bull;</Circle>
                                        </CryptoAmountWrapper>
                                    )}
                                    <Address>{input.addresses?.map(addr => addr)}</Address>
                                </IORow>
                            );
                        })}
                    </IOBox>

                    <IconWrapper>
                        <Icon icon="ARROW_DOWN" size={17} color={theme.TYPE_LIGHT_GREY} />
                    </IconWrapper>

                    <IOBox>
                        <IORowTitle>
                            <Translation id="TR_OUTPUTS" />
                        </IORowTitle>
                        {tx.details.vout.map(output => {
                            return (
                                <IORow key={output.n}>
                                    <CryptoAmountWrapper>
                                        <FormattedCryptoAmount
                                            value={output.value}
                                            symbol={tx.symbol}
                                        />
                                        <Circle>&bull;</Circle>
                                    </CryptoAmountWrapper>
                                    <Address>{output.addresses?.map(addr => addr)}</Address>
                                </IORow>
                            );
                        })}
                    </IOBox>
                </IOWrapper>
            )}
        </Wrapper>
    );
};

export default IODetails;
