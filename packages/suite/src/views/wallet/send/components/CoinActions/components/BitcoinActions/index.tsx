import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { OnOffSwitcher } from '@wallet-components';
import { Button } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

import Locktime from './components/Locktime';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div``;

const Row = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    margin-right: 8px;
`;

export default () => {
    const { addOutput, getValues, setValue, composeTransaction } = useSendFormContext();

    const bitcoinRBF = getValues('bitcoinRBF');
    const locktimeValue = getValues('bitcoinLockTime') || '';
    const hasLocktime = locktimeValue.length > 0;

    const [broadcastActive, setBroadcastActive] = useState<boolean>(true);
    const [locktimeActive, setLocktimeActive] = useState<boolean>(hasLocktime);

    const locktimeOpened = hasLocktime || locktimeActive;
    React.useEffect(() => {
        // bitcoinLockTime could be loaded later from draft, open additional form
        if (hasLocktime) setLocktimeActive(true);
    }, [hasLocktime]);

    return (
        <Wrapper>
            <Top>
                {locktimeOpened && (
                    <Locktime
                        setIsActive={() => {
                            // close additional form
                            setLocktimeActive(false);
                            composeTransaction('outputs[0].amount', false);
                        }}
                    />
                )}
            </Top>
            <Row>
                <Left>
                    {!locktimeOpened && (
                        <StyledButton
                            variant="tertiary"
                            icon="CALENDAR"
                            onClick={() => {
                                // open additional form
                                setLocktimeActive(true);
                            }}
                        >
                            <Translation id="TR_ADD_LOCKTIME" />
                        </StyledButton>
                    )}
                    {!locktimeOpened && (
                        <StyledButton
                            variant="tertiary"
                            icon="RBF"
                            onClick={() => {
                                setValue('bitcoinRBF', !bitcoinRBF);
                                composeTransaction('outputs[0].amount', false);
                            }}
                        >
                            <Translation id="TR_RBF" />
                            <OnOffSwitcher isOn={bitcoinRBF} />
                        </StyledButton>
                    )}
                    <StyledButton
                        variant="tertiary"
                        icon="RBF"
                        onClick={() => {
                            setBroadcastActive(!broadcastActive);
                        }}
                    >
                        <Translation id="TR_BROADCAST" />
                        <OnOffSwitcher isOn={broadcastActive} />
                    </StyledButton>
                </Left>
                <Right>
                    <Button
                        variant="tertiary"
                        icon="PLUS"
                        data-test="add-output"
                        onClick={addOutput}
                    >
                        <Translation id="TR_ANOTHER_RECIPIENT" />
                    </Button>
                </Right>
            </Row>
        </Wrapper>
    );
};
