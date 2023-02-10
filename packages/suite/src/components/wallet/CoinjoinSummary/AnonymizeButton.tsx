import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { goto } from '@suite-actions/routerActions';
import { Card, Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { TooltipButton } from '@trezor/components';
import {
    selectIsCoinjoinSelectedAccountBlockedByTor,
    selectIsCoinjoinBlockedByAmountsTooSmall,
} from '@wallet-reducers/coinjoinReducer';
import {
    Feature,
    selectIsFeatureDisabled,
    selectFeatureMessageContent,
} from '@suite-reducers/messageSystemReducer';

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
    const isCoinjoinBlockedByTor = useSelector(selectIsCoinjoinSelectedAccountBlockedByTor);
    const isCoinjoinBlockedByAmountsTooSmall = useSelector(state =>
        selectIsCoinjoinBlockedByAmountsTooSmall(state, accountKey),
    );

    const isCoinjoinDisabledByFeatureFlag = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.coinjoin),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.coinjoin),
    );

    const dispatch = useDispatch();

    const isDisabled =
        isCoinjoinDisabledByFeatureFlag ||
        isCoinjoinBlockedByAmountsTooSmall ||
        isCoinjoinBlockedByTor;

    const goToSetup = () => dispatch(goto('wallet-anonymize', { preserveParams: true }));

    const getTooltipContent = () => {
        if (isCoinjoinDisabledByFeatureFlag && featureMessageContent) {
            return featureMessageContent;
        }
        if (isCoinjoinBlockedByTor) {
            return <Translation id="TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP" />;
        }
        if (isCoinjoinBlockedByAmountsTooSmall) {
            return <Translation id="TR_UNAVAILABLE_COINJOIN_AMOUNTS_TOO_SMALL" />;
        }
    };

    return (
        <Button
            onClick={goToSetup}
            icon="ARROW_RIGHT_LONG"
            isDisabled={isDisabled}
            alignIcon="right"
            size={16}
            tooltipContent={getTooltipContent()}
        >
            <Translation id="TR_ANONYMIZE" />
        </Button>
    );
};
