import React from 'react';

import { Translation } from '@suite/intl';
import { Banner, Button, Text } from '@trezor/components';
import { HourglassIcon, RepeatIcon } from '@trezor/icons';
import { useClickCooldown } from '@trezor/react-utils';

import { CountdownTimer } from 'src/components/suite/CountdownTimer';
import { TxValidityCountdownBadge } from 'src/components/suite/TxValidityCountdownBadge';

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
                <TxValidityCountdownBadge
                    deadline={deadline}
                    pastDeadlineMessage="TR_TX_SEND_FAILED"
                    data-testid="@modal/header/timer"
                >
                    {isSending ? <Translation id="TR_CONFIRMING_TX" /> : undefined}
                </TxValidityCountdownBadge>
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
                <Text as="div" isTabular>
                    <Text typographyStyle="body-sm-strong" as="div">
                        <CountdownTimer
                            deadline={deadline}
                            unitDisplay="long"
                            message="TR_TX_CONFIRMATION_TIMER"
                            pastDeadlineMessage="TR_TX_SEND_FAILED"
                        />
                    </Text>
                    <Translation id="TR_SOLANA_TX_CONFIRMATION_TIMER_DESCRIPTION" />
                </Text>
            }
        />
    );
};
