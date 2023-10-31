import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { SavingsKYCCard } from 'src/views/wallet/coinmarket';
import { Image } from '@trezor/components';

const StyledCard = styled(SavingsKYCCard)`
    background: rgb(239 201 65 / 10%);
    color: #ba9924;
`;

const Icon = styled.div`
    margin-right: 14px;
    height: 22px;
    width: 22px;
`;
const Text = styled.div``;
const Header = styled.div`
    font-size: 16px;
    line-height: 28px;
`;
const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: 14px;
    line-height: 18px;
`;

export const KycInProgress = () => (
    <StyledCard>
        <Icon>
            <Image image="USER_FOCUS" />
        </Icon>
        <Text>
            <Header>
                <Translation id="TR_SAVINGS_SETUP_KYC_IN_PROGRESS_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_SETUP_KYC_IN_PROGRESS_DESCRIPTION" />
            </Description>
        </Text>
    </StyledCard>
);
