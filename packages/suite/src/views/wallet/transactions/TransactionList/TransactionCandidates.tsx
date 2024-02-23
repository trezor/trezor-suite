import styled from 'styled-components';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { Card, SVG_IMAGES, variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';
import { TransactionTypeIcon } from 'src/components/wallet/TransactionItem/TransactionTypeIcon';
import { TxTypeIconWrapper } from 'src/components/wallet/TransactionItem/CommonComponents';
import { Translation } from 'src/components/suite/Translation';
import TooltipSymbol from 'src/components/suite/TooltipSymbol';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';

const Header = styled.div`
    position: sticky;
    top: ${SUBPAGE_NAV_HEIGHT};
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 24px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    z-index: ${zIndices.secondaryStickyBar};
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
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 115px);

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0 8px;
    }
`;

const Text = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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
