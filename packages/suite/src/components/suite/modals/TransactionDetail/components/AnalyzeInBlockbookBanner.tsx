import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';

import { Button, Icon, Link, useTheme, variables, Warning } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const StyledWarning = styled(Warning)`
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const TextWrapper = styled.div`
    display: flex;
    text-align: start;
    flex-direction: column;

    ${variables.SCREEN_QUERY.MOBILE} {
        gap: 2px;
    }
`;

const Heading = styled.span`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledButton = styled(Button)`
    color: ${({ theme }) => theme.TYPE_WHITE};
    gap: 6px;
    background-color: ${({ theme }) => theme.TYPE_BLUE};
    font-size: ${variables.FONT_SIZE.SMALL};
    padding: 6px 10px;

    ${variables.SCREEN_QUERY.MOBILE} {
        width: 100%;
    }

    :hover,
    :focus {
        background-color: ${({ theme }) => darken(0.05, theme.TYPE_BLUE)};
    }
`;

interface AnalyzeInBlockbookBannerProps {
    txid: string;
}

export const AnalyzeInBlockbookBanner = ({ txid }: AnalyzeInBlockbookBannerProps) => {
    const theme = useTheme();

    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;
    const explorerUrl = network?.explorer.tx;

    return (
        <StyledWarning variant="info">
            <Wrapper>
                <Icon icon="CUBE" size={24} color={theme.TYPE_BLUE} />
                <TextWrapper>
                    <Heading>
                        <Translation id="TR_ANALYZE_IN_BLOCKBOOK" />
                    </Heading>
                    <Description>
                        <Translation id="TR_ANALYZE_IN_BLOCKBOOK_DESC" />
                    </Description>
                </TextWrapper>
            </Wrapper>
            <Link variant="nostyle" href={`${explorerUrl}${txid}`}>
                <StyledButton variant="primary">
                    <Translation id="TR_ANALYZE_IN_BLOCKBOOK_OPEN" />
                    <Icon icon="EXTERNAL_LINK" color={theme.TYPE_WHITE} size={20} />
                </StyledButton>
            </Link>
        </StyledWarning>
    );
};
