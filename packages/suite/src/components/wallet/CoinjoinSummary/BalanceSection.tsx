import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { goto } from '@suite-actions/routerActions';
import { Card, Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { variables, TooltipButton, Image } from '@trezor/components';
import {
    selectCoinjoinAccountByKey,
    selectCurrentCoinjoinBalanceBreakdown,
    selectIsCoinjoinBlockedByTor,
} from '@wallet-reducers/coinjoinReducer';
import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown';
import { CoinjoinStatus } from './CoinjoinStatus';
import {
    Feature,
    selectIsFeatureDisabled,
    selectFeatureMessageContent,
} from '@suite-reducers/messageSystemReducer';

const Container = styled(Card)`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    margin-bottom: 10px;
`;

const AnonymizeButton = styled(TooltipButton)`
    justify-content: space-between;
    width: 154px;
    height: 46px;
    margin-right: 10px;
    padding: 9px 18px;
`;

const AnonymizedIndicator = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 32px;
`;

const AmomymizedMessage = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface BalanceSectionProps {
    accountKey: string;
}

export const BalanceSection = ({ accountKey }: BalanceSectionProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));
    const { notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);
    const isCoinjoinBlockedByTor = useSelector(selectIsCoinjoinBlockedByTor);
    const isCoinJoinDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.coinjoin),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.coinjoin),
    );

    const dispatch = useDispatch();

    const allAnonymized = notAnonymized === '0';

    const goToSetup = () => dispatch(goto('wallet-anonymize', { preserveParams: true }));

    const getTooltipContent = () => {
        if (isCoinJoinDisabled && featureMessageContent) {
            return featureMessageContent;
        }
        if (isCoinjoinBlockedByTor) {
            return <Translation id="TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP" />;
        }
    };

    const getRightSideComponent = () => {
        if (coinjoinAccount?.session) {
            return <CoinjoinStatus session={coinjoinAccount.session} accountKey={accountKey} />;
        }

        if (allAnonymized) {
            return (
                <AnonymizedIndicator>
                    <Image image="CHECK_SHIELD" width={90} />
                    <AmomymizedMessage>
                        <Translation id="TR_ALL_FUNDS_ANONYMIZED" />
                    </AmomymizedMessage>
                </AnonymizedIndicator>
            );
        }

        return (
            <AnonymizeButton
                onClick={goToSetup}
                icon="ARROW_RIGHT_LONG"
                isDisabled={isCoinJoinDisabled || isCoinjoinBlockedByTor}
                alignIcon="right"
                size={16}
                tooltipContent={getTooltipContent()}
            >
                <Translation id="TR_ANONYMIZE" />
            </AnonymizeButton>
        );
    };

    return (
        <Container>
            <BalancePrivacyBreakdown />
            {getRightSideComponent()}
        </Container>
    );
};
