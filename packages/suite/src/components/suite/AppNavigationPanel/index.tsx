import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { useInView } from 'react-intersection-observer';
import React from 'react';
import { MAX_WIDTH, MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${props => props.theme.BG_LIGHT_GREY};
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};

    padding: 24px 32px 0px 32px;

    margin-bottom: 12px;

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
    padding-bottom: 11px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Title = styled(H1)`
    font-size: ${variables.NEUE_FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    white-space: nowrap;
    overflow: hidden;
    padding-left: 3px;
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

const STICKY_MENU_HEIGHT = 70;
const StickyMenu = styled.div<{ visible: boolean }>`
    position: sticky;
    top: 0;
    left: 0;
    height: 0;
    width: 100%;
    z-index: 2;
    transform: translate(0, -${STICKY_MENU_HEIGHT + 1}px);
    transition: all 0.3s ease;

    ${props =>
        props.visible &&
        `
        transform: translate(0, 0);
        `}

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const StickyMenuInner = styled.div`
    background: ${props => props.theme.BG_WHITE};
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

const StickyMenuHolder = styled.div<Pick<Props, 'maxWidth'>>`
    height: ${STICKY_MENU_HEIGHT}px;
    max-width: ${props => (props.maxWidth === 'default' ? MAX_WIDTH : MAX_WIDTH_WALLET_CONTENT)};
    align-items: center;
    margin: 0 auto;
`;

interface Props {
    title: React.ReactNode;
    ticker?: React.ReactNode;
    dropdown?: React.ReactNode;
    maxWidth: 'small' | 'default';
    children?: React.ReactNode;
    navigation?: React.ReactNode;
    navigationSticky?: React.ReactNode;
}

const AppNavigationPanel = (props: Props) => {
    const { ref, inView } = useInView({
        delay: 100,
        initialInView: true,
    });

    return (
        <>
            {props.navigationSticky && (
                <StickyMenu visible={!inView}>
                    <StickyMenuInner>
                        <StickyMenuHolder maxWidth={props.maxWidth}>
                            {props.navigationSticky}
                        </StickyMenuHolder>
                    </StickyMenuInner>
                </StickyMenu>
            )}
            <Wrapper ref={ref}>
                <Content maxWidth={props.maxWidth}>
                    <BasicInfo>
                        <TitleRow>
                            <Title noMargin>{props.title}</Title>
                            <Aside>
                                {props.ticker && props.ticker}
                                {props.dropdown && props.dropdown}
                            </Aside>
                        </TitleRow>
                        {props.children && <Row>{props.children}</Row>}
                    </BasicInfo>
                    {props.navigation}
                </Content>
            </Wrapper>
        </>
    );
};

export default AppNavigationPanel;
