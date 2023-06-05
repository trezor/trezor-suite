import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { Card, SVG_IMAGES, variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { selectCoinjoinAccountByKey } from '@wallet-reducers/coinjoinReducer';
import { SECONDARY_PANEL_HEIGHT } from '@suite-components/AppNavigation';
import { TransactionTypeIcon } from '@wallet-components/TransactionItem/components/TransactionTypeIcon';
import { TxTypeIconWrapper } from '@wallet-components/TransactionItem/components/CommonComponents';
import { Translation } from '@suite-components/Translation';
import TooltipSymbol from '@suite-components/TooltipSymbol';

const Header = styled.div`
    position: sticky;
    background: ${({ theme }) => theme.BG_GREY};
    top: ${SECONDARY_PANEL_HEIGHT};
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 24px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    z-index: ${variables.Z_INDEX.SECONDARY_STICKY_BAR};
`;

const Wrapper = styled(Card)`
    display: flex;
    flex-direction: row;
    padding: 12px 24px;
    font-variant-numeric: tabular-nums;
    border-left: 8px solid transparent;
    border-image: url(${resolveStaticPath(`images/svg/${SVG_IMAGES.STROKE_BORDER}`)});
    border-image-slice: 0 10;
    padding-left: 16px;
    margin: 8px 0 32px;
    /* height of secondary panel and a gap between transactions and graph */
    scroll-margin-top: calc(${SECONDARY_PANEL_HEIGHT} + 115px);

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0px 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0px 8px;
    }
`;

const Text = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Heading = styled.p`
    line-height: 1.5;
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    height: 29px; /* to match the TransacitonItem component */
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const TransactionCandidate = () => (
    <div>
        <Header>
            <Translation id="TR_CANDIDATE_TRANSACTION_HEADER" />
        </Header>

        <Wrapper>
            <TxTypeIconWrapper>
                <TransactionTypeIcon type="joint" isPending={false} />
            </TxTypeIconWrapper>

            <Text>
                <Heading>
                    <Translation id="TR_CANDIDATE_TRANSACTION" />
                </Heading>
                <Description>
                    <Translation id="TR_CANDIDATE_TRANSACTION_DESCRIPTION" />
                    <TooltipSymbol
                        content={<Translation id="TR_CANDIDATE_TRANSACTION_EXPLANATION" />}
                    />
                </Description>
            </Text>
        </Wrapper>
    </div>
);

interface TransactionCandidatesProps {
    accountKey: string;
}

export const TransactionCandidates = ({ accountKey }: TransactionCandidatesProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));

    if (!coinjoinAccount?.transactionCandidates) {
        return null;
    }

    return (
        <>
            {coinjoinAccount.transactionCandidates.map(candidate => (
                <TransactionCandidate key={candidate.roundId} />
            ))}
        </>
    );
};
