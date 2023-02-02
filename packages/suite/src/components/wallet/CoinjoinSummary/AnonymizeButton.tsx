import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { goto } from '@suite-actions/routerActions';
import { Card, Translation } from '@suite-components';
import { TooltipButton } from '@trezor/components';
import { useCoinjoinSessionBlockers } from '@suite/hooks/coinjoin/useCoinjoinSessionBlockers';

export const Container = styled(Card)`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 150px;
    align-items: center;
`;

const Button = styled(TooltipButton)`
    justify-content: space-between;
    width: 154px;
    height: 46px;
    margin-right: 10px;
    padding: 9px 18px;
`;

interface AnonymizeButtonProps {
    accountKey: string;
}

export const AnonymizeButton = ({ accountKey }: AnonymizeButtonProps) => {
    const dispatch = useDispatch();

    const { coinjoinSessionBlockedMessage, isCoinjoinSessionBlocked } =
        useCoinjoinSessionBlockers(accountKey);

    const goToSetup = () => dispatch(goto('wallet-anonymize', { preserveParams: true }));

    return (
        <Button
            onClick={goToSetup}
            icon="ARROW_RIGHT_LONG"
            isDisabled={isCoinjoinSessionBlocked}
            alignIcon="right"
            size={16}
            tooltipContent={coinjoinSessionBlockedMessage}
        >
            <Translation id="TR_ANONYMIZE" />
        </Button>
    );
};
