import styled from 'styled-components';
import { H1, colors, variables } from '@trezor/components';
import React from 'react';
import { MAX_WIDTH } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${colors.NEUE_BG_LIGHT_GREY};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-bottom: 22px;
`;

const Content = styled.div`
    display: flex;
    width: 100%;
    padding: 24px 32px 0px 32px;
    max-width: ${MAX_WIDTH};
    flex-direction: column;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 24px 16px 0px 16px;
    }
`;

const BasicInfo = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
`;

const Title = styled(H1)`
    font-size: ${variables.NEUE_FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    white-space: nowrap;
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
`;

const TitleRow = styled(Row)`
    margin-bottom: 6px;
    align-items: normal;
`;

interface Props {
    title: React.ReactNode;
    dropdown?: React.ReactNode;
    children?: React.ReactNode;
    navigation?: React.ReactNode;
}

const TopNavigationPanel = (props: Props) => {
    return (
        <Wrapper>
            <Content>
                <BasicInfo>
                    <TitleRow>
                        <Title noMargin>{props.title}</Title>
                        {props.dropdown && props.dropdown}
                    </TitleRow>
                    {props.children && <Row>{props.children}</Row>}
                </BasicInfo>
                {props.navigation}
            </Content>
        </Wrapper>
    );
};

export default TopNavigationPanel;
