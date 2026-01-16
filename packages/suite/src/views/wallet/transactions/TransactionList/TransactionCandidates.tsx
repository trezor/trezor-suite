import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Card, IMAGES, Paragraph, Tooltip, variables } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';
import { typography } from '@trezor/theme';

import { TxTypeIconWrapper } from 'src/components/wallet/TransactionItem/CommonComponents';
import { TransactionTypeIcon } from 'src/components/wallet/TransactionItem/TransactionTypeIcon';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';

const Header = styled.div`
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 24px;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.callout}
    text-transform: uppercase;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Wrapper = styled(Card)`
    display: flex;
    flex-direction: row;
    padding: 12px 24px;
    font-variant-numeric: tabular-nums;
    border-left: 8px solid transparent;
    border-image: url(${resolveStaticPath(`images/svg/${IMAGES.STROKE_BORDER}`)});
    border-image-slice: 0 10;
    padding-left: 16px;
    margin: 8px 0 32px;

    /* height of secondary panel and a gap between transactions and graph */
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 115px);

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 8px;
    }
`;

const Heading = styled.p`
    line-height: 1.5;
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    height: 29px; /* to match the TransacitonItem component */
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
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

            <Paragraph typographyStyle="body" variant="default">
                <Heading>
                    <Translation id="TR_CANDIDATE_TRANSACTION" />
                </Heading>
                <Description>
                    <Tooltip
                        content={<Translation id="TR_CANDIDATE_TRANSACTION_EXPLANATION" />}
                        maxWidth={250}
                        hasIcon
                    >
                        <Translation id="TR_CANDIDATE_TRANSACTION_DESCRIPTION" />
                    </Tooltip>
                </Description>
            </Paragraph>
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
