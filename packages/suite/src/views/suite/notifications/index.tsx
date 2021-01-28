import { LayoutContext, Notifications, Translation } from '@suite-components';
import { MAX_WIDTH } from '@suite-constants/layout';
import { variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: ${MAX_WIDTH};
`;
const Content = styled.div`
    background-color: ${props => props.theme.BG_WHITE};
`;

const Headline = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.BIG};
    margin-top: 4px;
    margin-bottom: 24px;
    padding-left: 12px;
`;

const NotificationsView = () => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useEffect(() => {
        if (setLayout) setLayout('Notifications', undefined);
    }, [setLayout]);

    return (
        <Wrapper>
            <Headline>
                <Translation id="NOTIFICATIONS_TITLE" />
            </Headline>
            <Content>
                <Notifications />
            </Content>
        </Wrapper>
    );
};

export default NotificationsView;
