import styled from 'styled-components';

import { variables } from '@trezor/components';
import { NotificationCard, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { typography } from '@trezor/theme';

const TextWrapper = styled.div`
    display: flex;
    text-align: start;
    flex-direction: column;

    ${variables.SCREEN_QUERY.MOBILE} {
        gap: 2px;
    }
`;

const Heading = styled.span`
    font-weight: ${typography.highlight};
`;

const Description = styled.span`
    color: ${({ theme }) => theme.textSubdued};
`;

interface AnalyzeInExplorerBannerProps {
    txid: string;
}

export const AnalyzeInExplorerBanner = ({ txid }: AnalyzeInExplorerBannerProps) => {
    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;
    const explorerUrl = network?.explorer.tx;

    return (
        <NotificationCard
            variant="info"
            icon="CUBE"
            button={{
                href: `${explorerUrl}${txid}`,
                children: <Translation id="TR_ANALYZE_IN_BLOCKBOOK_OPEN" />,
                icon: 'EXTERNAL_LINK',
                iconAlignment: 'right',
                size: 'small',
            }}
        >
            <TextWrapper>
                <Heading>
                    <Translation id="TR_ANALYZE_IN_BLOCKBOOK" />
                </Heading>
                <Description>
                    <Translation id="TR_ANALYZE_IN_BLOCKBOOK_DESC" />
                </Description>
            </TextWrapper>
        </NotificationCard>
    );
};
