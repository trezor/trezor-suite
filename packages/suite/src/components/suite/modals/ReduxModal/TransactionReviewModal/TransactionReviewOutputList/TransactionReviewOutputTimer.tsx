import React from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Badge, Banner, Button, Text } from '@trezor/components';
import { HourglassIcon, RepeatIcon } from '@trezor/icons';
import { useClickCooldown } from '@trezor/react-utils';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';

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
                <Button
                    iconLeft={RepeatIcon}
                    intent="neutral"
                    priority="secondary"
                    type="button"
                    size="small"
                    isDisabled={isSending || disabled}
                    onClick={() => handleClick(() => onTryAgain(true))}
                    data-testid="@modal/header/try-again-button"
                >
                    <Translation id="TR_TRY_AGAIN" />
                </Button>
                <Badge intent="warning">
                    <TimerBox data-testid="@modal/header/timer">
                        {isSending ? (
                            <Translation id="TR_CONFIRMING_TX" />
                        ) : (
                            <CountdownTimer
                                deadline={deadline}
                                unitDisplay="narrow"
                                message="TR_TX_CONFIRMATION_TIMER_SHORT"
                                pastDeadlineMessage="TR_TX_SEND_FAILED"
                            />
                        )}
                    </TimerBox>
                </Badge>
            </>
        );
    }

    return (
        <Banner
            icon={HourglassIcon}
            rightContent={
                <Banner.Button isDisabled={isSending} onClick={() => onTryAgain(true)}>
                    <Translation id="TR_TRY_AGAIN" />
                </Banner.Button>
            }
            description={
                <TimerBox>
                    <Text typographyStyle="body-sm-strong" as="div">
                        <CountdownTimer
                            deadline={deadline}
                            unitDisplay="long"
                            message="TR_TX_CONFIRMATION_TIMER"
                            pastDeadlineMessage="TR_TX_SEND_FAILED"
                        />
                    </Text>
                    <Translation id="TR_SOLANA_TX_CONFIRMATION_TIMER_DESCRIPTION" />
                </TimerBox>
            }
        />
    );
};
