import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { SavingsKYCCard } from 'src/views/wallet/coinmarket';
import { Image } from '@trezor/components';

const StyledCard = styled(SavingsKYCCard)`
    background: rgb(239 65 65 / 10%);
    color: ${({ theme }) => theme.BG_RED};
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
    font-size: 14px;
    line-height: 18px;
`;

interface KYCFailedProps {
    providerName?: string;
}

export const KycFailed = ({ providerName }: KYCFailedProps) => (
    <StyledCard>
        <Icon>
            <Image image="WARNING" />
        </Icon>
        <Text>
            <Header>
                <Translation id="TR_SAVINGS_SETUP_KYC_FAILED_HEADER" />
            </Header>
            <Description>
                <Translation
                    id="TR_SAVINGS_SETUP_KYC_FAILED_DESCRIPTION"
                    values={{
                        providerName,
                    }}
                />
            </Description>
        </Text>
    </StyledCard>
);
