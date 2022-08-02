import React from 'react';
import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import { CoinBalance } from '@wallet-components';
import { Account, CoinjoinSessionParameters } from '@suite-common/wallet-types';

const Wrapper = styled(Card)`
    border: 1px solid ${props => props.theme.STROKE_GREY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Cell = styled(Card)`
    flex: 1;
    background: ${props => props.theme.BG_LIGHT_GREY};
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
    margin: 24px 0px;
`;

interface CoinjoinSessionDetailProps extends CoinjoinSessionParameters {
    account: Account;
}

export const CoinjoinSessionDetail = ({
    account,
    anonymityLevel,
    maxRounds,
    maxFeePerKvbyte,
    maxCoordinatorFeeRate,
}: CoinjoinSessionDetailProps) => (
    <Wrapper>
        <Row>
            <Cell>
                Amount: <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
            </Cell>
            <Cell>Anonymity level: {anonymityLevel}</Cell>
        </Row>
        <Row>
            Max rounds: <span>{maxRounds}</span>
        </Row>
        <Row>
            Max mining fee: <span>{Math.round(maxFeePerKvbyte / 1000)} sat/vbyte</span>
        </Row>
        <Divider />
        <Row>
            Coordinator fee: <span>{maxCoordinatorFeeRate / 10 ** 10} %</span>
        </Row>
    </Wrapper>
);
