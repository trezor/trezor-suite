import { Image, LayoutContext, Notifications, Translation } from '@suite-components';
import { DESKTOP_TITLEBAR_HEIGHT, MAX_WIDTH } from '@suite-constants/layout';
import { isDesktop } from '@suite-utils/env';
import { H2, P, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';

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

const EmptyWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 32px 32px 32px;
    height: ${isDesktop() ? `calc(100vh - ${DESKTOP_TITLEBAR_HEIGHT})` : '100vh'};
    justify-content: center;
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const NotificationsMobile = (props: Props) => {
    // TODO: filter notifications only for selected device
    // TODO: decide which notification should be displayed
    // TODO: decide which notification should have CTA
    // const notifications = props.notifications.filter(n =>
    //     deviceUtils.isSelectedInstance(props.device, n.device),
    // );
    const { notifications } = props;

    const { setLayout } = React.useContext(LayoutContext);
    React.useEffect(() => {
        if (setLayout) setLayout('Notifications', undefined);
    }, [setLayout]);

    if (notifications.length < 1) {
        return (
            <>
                <EmptyWrapper>
                    <H2>
                        <Translation id="NOTIFICATIONS_EMPTY_TITLE" />
                    </H2>
                    <P size="small">
                        <Translation id="NOTIFICATIONS_EMPTY_DESC" />
                    </P>
                    <StyledImage image="UNI_EMPTY_PAGE" />
                </EmptyWrapper>
            </>
        );
    }

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

export default NotificationsMobile;
