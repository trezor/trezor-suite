import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Button, Icon } from '@trezor/components';
import { startCoinjoinSession } from '@wallet-actions/coinjoinAccountActions';
import { useActions } from '@suite-hooks';
import { CoinjoinSessionDetail } from './CoinjoinSessionDetail';
import { Account } from '@suite-common/wallet-types';

const Wrapper = styled(Card)`
    width: 100%;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    flex-direction: row;
    padding-bottom: 24px;
`;

const Section = styled.div`
    padding: 10px;
`;

const SelectButton = styled(Button)<{ isActive?: boolean }>`
    width: 200px;
    height: 100px;
    background: transparent;
    border: 1px solid
        ${props => (!props.isActive ? props.theme.BG_SECONDARY : props.theme.TYPE_GREEN)};
`;

// Parameters sent to TrezorConnect.authorizeCoinjoin method
const COINJOIN_STRATEGIES = {
    default: {
        maxRounds: 10,
        anonymityLevel: 80,
        maxFeePerKvbyte: 129000,
        maxCoordinatorFeeRate: 0.003 * 10 ** 10, // 0.003 from coordinator
    },
    speed: {
        maxRounds: 3,
        anonymityLevel: 40,
        maxFeePerKvbyte: 129000,
        maxCoordinatorFeeRate: 0.003 * 10 ** 10, // 0.003 from coordinator
    },
};

interface CoinjoinSetupStrategiesProps {
    account: Account;
}

export const CoinjoinSetupStrategies = ({ account }: CoinjoinSetupStrategiesProps) => {
    const [strategy, setStrategy] = useState<keyof typeof COINJOIN_STRATEGIES>('default');
    const actions = useActions({
        startCoinjoinSession,
    });

    const selectedStrategy = COINJOIN_STRATEGIES[strategy];

    return (
        <Wrapper>
            <Content>
                <Section style={{ flex: 1 }}>
                    <SelectButton
                        isActive={strategy === 'default'}
                        variant="tertiary"
                        onClick={() => setStrategy('default')}
                    >
                        Default
                        {strategy === 'default' && <Icon icon="CHECK_ACTIVE" />}
                    </SelectButton>
                    <SelectButton
                        isActive={strategy === 'speed'}
                        variant="tertiary"
                        onClick={() => setStrategy('speed')}
                    >
                        Speed
                        {strategy === 'speed' && <Icon icon="CHECK_ACTIVE" />}
                    </SelectButton>
                </Section>
                <Section>
                    <CoinjoinSessionDetail account={account} {...selectedStrategy} />
                </Section>
            </Content>
            <Button
                onClick={() => actions.startCoinjoinSession(account, selectedStrategy)}
                icon="ARROW_RIGHT_LONG"
                alignIcon="right"
            >
                Start coinjoin
            </Button>
        </Wrapper>
    );
};
