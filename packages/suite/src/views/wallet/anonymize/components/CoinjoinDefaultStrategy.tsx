import React from 'react';
import styled from 'styled-components';

import { RECOMMENDED_SKIP_ROUNDS } from '@suite/services/coinjoin/config';
import { Translation } from '@suite-components';
import { Button, P, variables } from '@trezor/components';
import { CoinjoinClientFeeRatesMedians } from '@wallet-reducers/coinjoinReducer';
import { RadioFrame } from './RadioFrame';
import { CoinjoinSessionDetail } from './CoinjoinSessionDetail';

const Row = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
`;

const ButtonRow = styled(Row)`
    gap: 12px;
`;

const Heading = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Text = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 20px 0;
`;

export type CoinJoinStrategy = 'custom' | 'fast' | 'recommended';

interface CoinjoinDefaultStrategyProps {
    feeRatesMedians: CoinjoinClientFeeRatesMedians;
    maxRounds: number;
    setStrategy: React.Dispatch<React.SetStateAction<CoinJoinStrategy>>;
    strategy: CoinJoinStrategy;
}

export const CoinjoinDefaultStrategy = ({
    feeRatesMedians,
    maxRounds,
    strategy,
    setStrategy,
}: CoinjoinDefaultStrategyProps) => {
    const isRecommended = strategy === 'recommended';

    const setCustom = () => setStrategy('custom');
    const setRecommended = () => setStrategy('recommended');
    const setFast = () => setStrategy('fast');

    return (
        <>
            <Row>
                <Heading>
                    <Translation id="TR_SETUP" />
                </Heading>
                <Button variant="tertiary" icon="CUSTOMIZE" onClick={setCustom}>
                    <Translation id="TR_CUSTOM_SETUP" />
                </Button>
            </Row>
            <Text>
                <Translation id="TR_COIN_JOIN_STRATEGY" />
            </Text>
            <ButtonRow>
                <RadioFrame
                    heading="TR_RECOMMENDED"
                    subheading="TR_RECOMMENDED_SUBHEADING"
                    isSelected={isRecommended}
                    onClick={setRecommended}
                >
                    <CoinjoinSessionDetail
                        maxRounds={maxRounds}
                        maxFee={feeRatesMedians.recommended}
                        skipRounds={RECOMMENDED_SKIP_ROUNDS}
                    />
                </RadioFrame>
                <RadioFrame
                    heading="TR_FAST"
                    subheading="TR_FAST_SUBHEADING"
                    isSelected={!isRecommended}
                    onClick={setFast}
                >
                    <CoinjoinSessionDetail
                        maxRounds={maxRounds}
                        maxFee={feeRatesMedians.fast}
                        skipRounds={null}
                    />
                </RadioFrame>
            </ButtonRow>
        </>
    );
};
