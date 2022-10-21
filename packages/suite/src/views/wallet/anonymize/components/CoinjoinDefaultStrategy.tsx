import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button, P, variables } from '@trezor/components';
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

// Parameters sent to TrezorConnect.authorizeCoinjoin method
// TODO: replace with dynamic values
export const COINJOIN_STRATEGIES = {
    recommended: {
        maxRounds: 10,
        targetAnonymity: 80,
        maxFeePerKvbyte: 129000,
        maxCoordinatorFeeRate: 0.003 * 10 ** 10, // 0.003 from coordinator
    },
    fast: {
        maxRounds: 3,
        targetAnonymity: 40,
        maxFeePerKvbyte: 129000,
        maxCoordinatorFeeRate: 0.003 * 10 ** 10, // 0.003 from coordinator
    },
};

export type CoinJoinStrategy = keyof typeof COINJOIN_STRATEGIES | 'custom';

interface CoinjoinDefaultStrategyProps {
    setStrategy: React.Dispatch<React.SetStateAction<CoinJoinStrategy>>;
    strategy: CoinJoinStrategy;
}

export const CoinjoinDefaultStrategy = ({
    strategy,
    setStrategy,
}: CoinjoinDefaultStrategyProps) => {
    const isRecommended = strategy === 'recommended';
    const isFast = strategy === 'fast';

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
                        maxRounds={COINJOIN_STRATEGIES.recommended.maxRounds}
                        maxFee={3}
                        hours={[8, 16]}
                        skipRounds={[4, 5]}
                    />
                </RadioFrame>
                <RadioFrame
                    heading="TR_FAST"
                    subheading="TR_FAST_SUBHEADING"
                    isSelected={isFast}
                    onClick={setFast}
                >
                    <CoinjoinSessionDetail
                        maxRounds={COINJOIN_STRATEGIES.fast.maxRounds}
                        maxFee={10}
                        hours={[2, 14]}
                        skipRounds={null}
                    />
                </RadioFrame>
            </ButtonRow>
        </>
    );
};
