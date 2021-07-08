import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { MAX_WIDTH, MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${props => props.theme.BG_LIGHT_GREY};
    padding: 24px 32px 0px 32px;
    z-index: 3;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 24px 16px 0px 16px;
    }
`;

const Content = styled.div<Pick<Props, 'maxWidth'>>`
    display: flex;
    width: 100%;
    max-width: ${props => (props.maxWidth === 'default' ? MAX_WIDTH : MAX_WIDTH_WALLET_CONTENT)};
    flex-direction: column;
`;

const BasicInfo = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
`;

const Title = styled(H1)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    white-space: nowrap;
    overflow: hidden;
`;

const Aside = styled.div`
    display: flex;
    & > * + * {
        margin-left: 10px;
    }
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
`;

const TitleRow = styled(Row)`
    margin-bottom: 6px;
`;

const Delimeter = styled.div``;

interface Props {
    title: React.ReactNode;
    ticker?: React.ReactNode;
    dropdown?: React.ReactNode;
    maxWidth: 'small' | 'default';
    children?: React.ReactNode;
    navigation?: React.ReactNode;
    refer: React.Ref<HTMLDivElement>;
}

const AppNavigationPanelInner = (props: Props) => (
    <>
        <Wrapper ref={props.refer}>
            <Content maxWidth={props.maxWidth}>
                <BasicInfo>
                    <TitleRow>
                        <Title noMargin>{props.title}</Title>
                        <Aside>
                            {props.ticker}
                            {props.dropdown}
                        </Aside>
                    </TitleRow>
                    <Row>{props.children}</Row>
                </BasicInfo>
            </Content>
        </Wrapper>
        {props.navigation}
        <Delimeter />
    </>
);

export default AppNavigationPanelInner;
