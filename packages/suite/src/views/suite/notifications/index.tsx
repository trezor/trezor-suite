import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { H2, Icon, P, Button, colors } from '@trezor/components';
import { SuiteLayout, Translation } from '@suite-components';
import messages from '@suite/support/messages';
import * as notificationsUtils from '@suite-utils/notifications';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 16px 32px 32px 32px;
    max-width: 1024px;
`;

const EmptyWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 32px 32px 32px;
    height: 100vh;
    justify-content: center;
`;

const Item = styled.div`
    display: flex;
    border-bottom: 1px solid ${colors.BLACK96};
    padding: 16px 0px;
`;

const Text = styled.div`
    flex: 1;
    padding: 0px 16px;
`;

const Image = styled.img`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const ActionButton = styled(Button)`
    min-width: 120px;
`;

// const events:

export default (props: Props) => {
    // TODO: filter notifications only for selected device
    // TODO: decide which notification should be displayed
    // TODO: decide which notification should have CTA
    // const notifications = props.notifications.filter(n => t.type)

    if (props.notifications.length < 1) {
        return (
            <SuiteLayout title="Notifications">
                <EmptyWrapper>
                    <H2>
                        <Translation {...messages.NOTIFICATIONS_EMPTY_TITLE} />
                    </H2>
                    <P size="tiny">
                        <Translation {...messages.NOTIFICATIONS_EMPTY_DESC} />
                    </P>
                    <Image src={resolveStaticPath(`images/suite/uni-empty-page.svg`)} />
                </EmptyWrapper>
            </SuiteLayout>
        );
    }
    return (
        <SuiteLayout title="Notifications">
            <Wrapper>
                <H2>
                    <Translation {...messages.NOTIFICATIONS_TITLE} />
                </H2>
                {props.notifications.map(n => {
                    const item = notificationsUtils.getNotificationMessage(n, props.dispatch);
                    if (n.type !== 'tx-confirmed') {
                        delete item.action;
                    }
                    return (
                        <Item key={n.id}>
                            {item.icon && (
                                <Icon size={16} icon={item.icon} style={{ marginTop: '4px' }} />
                            )}
                            <Text>
                                <P>
                                    <Translation {...item.message} />
                                </P>
                                <P size="tiny">
                                    <FormattedDate
                                        value={n.id}
                                        year="numeric"
                                        month="2-digit"
                                        day="2-digit"
                                        hour="2-digit"
                                        minute="2-digit"
                                    />
                                </P>
                            </Text>
                            {item.actionLabel && item.action && (
                                <ActionButton variant="secondary" onClick={item.action}>
                                    <Translation {...item.actionLabel} />
                                </ActionButton>
                            )}
                        </Item>
                    );
                })}
            </Wrapper>
        </SuiteLayout>
    );
};
