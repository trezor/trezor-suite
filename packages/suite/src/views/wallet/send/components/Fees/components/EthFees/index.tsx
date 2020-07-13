import React from 'react';
import { Translation, FiatValue } from '@suite-components';
import { colors, variables } from '@trezor/components';
import GasPrice from './components/GasPrice';
import GasLimit from './components/GasLimit';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin: 32px 42px;
`;

const Top = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Bottom = styled.div`
    display: flex;
    justify-content: space-between;
    padding-top: 20px;
`;

const Space = styled.div`
    min-width: 26px;
`;

const Left = styled.div``;
const Right = styled.div``;

const Text = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const Label = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export default () => {
    const {
        account: { symbol },
        transactionInfo,
    } = useSendFormContext();

    return (
        <Wrapper>
            <Top>
                <GasLimit />
                <Space />
                <GasPrice />
            </Top>
            <Bottom>
                <Left>
                    <Text>
                        <Translation id="TR_FEE" />
                    </Text>
                    <Label>
                        <Translation id="TR_FEE_ETH_EXPLANATION" />
                    </Label>
                </Left>
                {transactionInfo && (
                    <Right>
                        <Text>
                            {formatNetworkAmount(transactionInfo.fee, symbol)}
                            <Label>{symbol}</Label>
                        </Text>
                        <Label>
                            <FiatValue
                                amount={formatNetworkAmount(transactionInfo.fee, symbol)}
                                symbol={symbol}
                            />
                        </Label>
                    </Right>
                )}
            </Bottom>
        </Wrapper>
    );
};
