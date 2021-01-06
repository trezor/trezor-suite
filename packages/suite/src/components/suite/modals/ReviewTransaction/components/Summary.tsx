import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme, CoinLogo } from '@trezor/components';
import { Translation } from '@suite-components';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    padding: 20px 15px;
    display: flex;
    flex-direction: column;
    border-radius: 7px;
    background: ${props => props.theme.BG_GREY};
    width: 225px;
    justify-content: center;
    align-items: center;
`;

const IconWrapper = styled.div`
    background-color: ${props => props.theme.BG_WHITE};
    padding: 4px;
    border-radius: 100px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
        margin: 0 auto;
        display: block;
    }
`;

const NestedIconWrapper = styled(IconWrapper)`
    width: 16px;
    height: 16px;
    position: absolute;
    top: 0px;
    right: 0px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
`;

const Headline = styled.div`
    font-size: 16px;
    font-weight: 600;
    margin-top: 20px;
`;

const AccountWrapper = styled.div`
    font-size: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: flex;
    margin-top: 5px;
    & > div {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const LeftDetails = styled.div`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin-top: 20px;
    padding: 20px 0;
    width: 100%;
    flex-direction: column;
`;

const LeftDetailsRow = styled.div`
    display: flex;
    font-size: 12px;
    & + & {
        margin-top: 10px;
    }
`;

const ReviewRbfLeftDetailsLineLeft = styled.div`
    display: flex;
    margin: 0 5px 0 0;
    width: 50%;
    color: ${props => props.theme.TYPE_LIGHT_GREY};

    & > div:first-child {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const ReviewRbfLeftDetailsLineRight = styled.div<{ color: string; uppercase?: boolean }>`
    color: ${props => props.color};
    font-weight: 500;
    ${({ uppercase }) =>
        uppercase &&
        `
        text-transform: uppercase;
  `};
`;

interface Props {
    account: Account;
    feeRate: string;
    rbf?: boolean;
}

const Summary = ({ account, feeRate, rbf }: Props) => {
    const theme = useTheme();

    const accountLabel = account.metadata.accountLabel ? (
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {account.metadata.accountLabel}
        </span>
    ) : (
        <>
            <Translation id={getTitleForNetwork(account.symbol)} />
            <span>&nbsp;#{account.index + 1}</span>
        </>
    );

    return (
        <Wrapper>
            <IconWrapper>
                <CoinLogo size={48} symbol={account.symbol} />
                <NestedIconWrapper>
                    <Icon size={12} color={theme.TYPE_DARK_GREY} icon="SEND" />
                </NestedIconWrapper>
            </IconWrapper>
            <Headline>
                <Translation id={rbf ? 'TR_REPLACE_TX' : 'TR_FINALIZE_TX'} />
            </Headline>
            <AccountWrapper>
                <Icon size={12} color={theme.TYPE_DARK_GREY} icon="WALLET" />
                {accountLabel}
            </AccountWrapper>
            <LeftDetails>
                <LeftDetailsRow>
                    <ReviewRbfLeftDetailsLineLeft>
                        <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="GAS" />
                        <Translation id="TR_INCREASED_FEE_RATE" />
                    </ReviewRbfLeftDetailsLineLeft>
                    <ReviewRbfLeftDetailsLineRight color={theme.TYPE_DARK_GREY}>
                        {feeRate} sat/B
                    </ReviewRbfLeftDetailsLineRight>
                </LeftDetailsRow>
                <LeftDetailsRow>
                    <ReviewRbfLeftDetailsLineLeft>
                        <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="RBF" />
                        <Translation id="RBF" />
                    </ReviewRbfLeftDetailsLineLeft>
                    <ReviewRbfLeftDetailsLineRight
                        color={rbf ? theme.TYPE_GREEN : theme.TYPE_ORANGE}
                        uppercase
                    >
                        <Translation id={rbf ? 'TR_ON' : 'TR_OFF'} />
                    </ReviewRbfLeftDetailsLineRight>
                </LeftDetailsRow>
            </LeftDetails>
        </Wrapper>
    );
};

export default Summary;
