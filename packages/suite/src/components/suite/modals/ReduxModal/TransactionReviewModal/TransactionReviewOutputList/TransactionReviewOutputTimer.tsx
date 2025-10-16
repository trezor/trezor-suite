import React from 'react';

import styled from 'styled-components';

import { Badge, Banner, NewButton, Text } from '@trezor/components';
import { useClickCooldown } from '@trezor/react-utils';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { Translation } from 'src/components/suite/Translation';

const TimerBox = styled.div`
    font-variant-numeric: tabular-nums;
`;

type TransactionReviewOutputTimerProps = {
    deadline: number;
    isMinimal?: boolean;
    onTryAgain: (close: boolean) => void;
    isSending?: boolean;
};

export const TransactionReviewOutputTimer = ({
    deadline,
    isMinimal,
    onTryAgain,
    isSending,
}: TransactionReviewOutputTimerProps) => {
    const { handleClick, disabled } = useClickCooldown();

    if (isMinimal) {
        return (
            <>
                <NewButton
                    iconLeft="repeat"
                    intent="neutral"
                    priority="secondary"
                    type="button"
                    size="small"
                    isDisabled={isSending || disabled}
                    onClick={() => handleClick(() => onTryAgain(true))}
                >
                    <Translation id="TR_RETRY" />
                </NewButton>
                <Badge variant="warning">
                    <TimerBox>
                        {isSending ? (
                            <Translation id="TR_CONFIRMING_TX" />
                        ) : (
                            <CountdownTimer
                                deadline={deadline}
                                unitDisplay="narrow"
                                message="TR_TX_CONFIRMATION_TIMER_SHORT"
                                pastDeadlineMessage="TR_TX_SEND_FAILED_TITLE"
                            />
                        )}
                    </TimerBox>
                </Badge>
            </>
        );
    }

    return (
        <Banner
            icon="hourglass"
            rightContent={
                <Banner.Button isDisabled={isSending} onClick={() => onTryAgain(true)}>
                    <Translation id="TR_RETRY" />
                </Banner.Button>
            }
        >
            <TimerBox>
                <Text typographyStyle="callout" as="div">
                    <CountdownTimer
                        deadline={deadline}
                        unitDisplay="long"
                        message="TR_TX_CONFIRMATION_TIMER"
                        pastDeadlineMessage="TR_TX_SEND_FAILED_TITLE"
                    />
                </Text>
                <Translation id="TR_SOLANA_TX_CONFIRMATION_TIMER_DESCRIPTION" />
            </TimerBox>
        </Banner>
    );
};
