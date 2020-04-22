import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables, Loader } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import FiatValue from '@suite-components/FiatValue/Container';
import { Badge, HiddenPlaceholder } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`;

const IOWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Col = styled.div<{ direction: 'column' | 'row' }>`
    display: flex;
    flex-direction: ${props => props.direction};
    flex: 1 1 calc(50% - 16px);
    overflow: hidden;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    padding: 8px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
        justify-content: center;
        transform: rotate(90deg);
    }
`;

const IOBox = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 3px;
    background-color: ${colors.BLACK96};
    padding: 12px;
    text-align: left;

    & + & {
        margin-top: 10px;
    }

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

// const IOBoxPath = styled.div`
//     display: flex;
//     font-size: ${variables.FONT_SIZE.TINY};
//     color: ${colors.BLACK50};
//     margin-bottom: 10px;
// `;

const IOBoxAmountWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Title = styled.div`
    color: ${colors.BLACK0};
    text-align: center;
    margin-bottom: 18px;
`;

const Amount = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const IOBoxAddress = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK17};
    overflow: hidden;
    text-overflow: ellipsis;

    margin-bottom: 10px;
`;

const HistoricalBadge = styled(props => <Badge {...props} isGray />)`
    margin-right: 8px;
`;

const BadgesWrapper = styled.div`
    display: flex;
`;

interface Props {
    tx: WalletAccountTransaction;
    txDetails: any;
    isFetching: boolean;
}

const IODetails = ({ tx, txDetails, isFetching }: Props) => {
    return (
        <Wrapper>
            <Title>Inputs/Outputs</Title>
            {!txDetails && isFetching && <Loader size={32} />}
            {txDetails?.vin && txDetails?.vout && (
                <IOWrapper>
                    <Col direction="column">
                        {txDetails.vin?.map((input: any) => {
                            let inputAmount = formatNetworkAmount(input.value, tx.symbol);
                            inputAmount = inputAmount === '-1' ? '0' : inputAmount;
                            return (
                                <IOBox key={input.hex}>
                                    <IOBoxAddress>
                                        <HiddenPlaceholder>
                                            {input.addresses.map((addr: string) => addr)}
                                        </HiddenPlaceholder>
                                    </IOBoxAddress>
                                    {/* <IOBoxPath>placeholder</IOBoxPath> */}
                                    <IOBoxAmountWrapper>
                                        <HiddenPlaceholder>
                                            <Amount>{`${inputAmount} ${tx.symbol.toUpperCase()}`}</Amount>
                                        </HiddenPlaceholder>

                                        <BadgesWrapper>
                                            <HiddenPlaceholder>
                                                <FiatValue
                                                    amount={inputAmount}
                                                    symbol={tx.symbol}
                                                    source={tx.rates}
                                                    useCustomSource
                                                >
                                                    {({ value }) =>
                                                        value ? (
                                                            <HistoricalBadge isGrey>
                                                                {value}
                                                            </HistoricalBadge>
                                                        ) : null
                                                    }
                                                </FiatValue>
                                            </HiddenPlaceholder>
                                            <HiddenPlaceholder>
                                                <FiatValue amount={inputAmount} symbol={tx.symbol}>
                                                    {({ value }) =>
                                                        value ? <Badge>{value}</Badge> : null
                                                    }
                                                </FiatValue>
                                            </HiddenPlaceholder>
                                        </BadgesWrapper>
                                    </IOBoxAmountWrapper>
                                </IOBox>
                            );
                        })}
                    </Col>

                    <IconWrapper>
                        <Icon icon="ARROW_RIGHT" size={16} />
                    </IconWrapper>

                    <Col direction="column">
                        {txDetails.vout?.map((output: any) => {
                            let outputAmount = formatNetworkAmount(output.value, tx.symbol);
                            outputAmount = outputAmount === '-1' ? '0' : outputAmount;
                            return (
                                <IOBox key={output.hex}>
                                    <IOBoxAddress>
                                        <HiddenPlaceholder>
                                            {output.addresses.map((addr: string) => addr)}
                                        </HiddenPlaceholder>
                                    </IOBoxAddress>
                                    {/* <IOBoxPath>todo: bip44 path</IOBoxPath> */}
                                    <IOBoxAmountWrapper>
                                        <HiddenPlaceholder>
                                            <Amount>{`${outputAmount} ${tx.symbol.toUpperCase()}`}</Amount>
                                        </HiddenPlaceholder>
                                        <BadgesWrapper>
                                            <HiddenPlaceholder>
                                                <FiatValue
                                                    amount={outputAmount}
                                                    symbol={tx.symbol}
                                                    source={tx.rates}
                                                    useCustomSource
                                                >
                                                    {({ value }) =>
                                                        value ? (
                                                            <HistoricalBadge isGrey>
                                                                {value}
                                                            </HistoricalBadge>
                                                        ) : null
                                                    }
                                                </FiatValue>
                                            </HiddenPlaceholder>
                                            <HiddenPlaceholder>
                                                <FiatValue amount={outputAmount} symbol={tx.symbol}>
                                                    {({ value }) =>
                                                        value ? <Badge>{value}</Badge> : null
                                                    }
                                                </FiatValue>
                                            </HiddenPlaceholder>
                                        </BadgesWrapper>
                                    </IOBoxAmountWrapper>
                                </IOBox>
                            );
                        })}
                    </Col>
                </IOWrapper>
            )}
        </Wrapper>
    );
};

export default IODetails;
