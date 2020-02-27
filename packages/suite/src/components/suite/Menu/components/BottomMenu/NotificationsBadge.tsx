import React from 'react';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    color: ${colors.WHITE};
    background: ${colors.GREEN};
    padding: 2px 4px;
    font-size: 10px;
    border-radius: 4px;
    min-width: 12px;
    font-weight: 600;
`;

const mapStateToProps = (state: AppState) => ({
    notifications: state.notifications,
});

type Props = ReturnType<typeof mapStateToProps> & {
    defaultIcon: JSX.Element;
};

const NotificationIcon = ({ notifications, defaultIcon }: Props) => {
    const unseen = notifications.filter(n => !n.seen);
    if (!unseen.length) {
        return defaultIcon;
    }

    return <Wrapper>{unseen.length}</Wrapper>;
};

export default connect(mapStateToProps)(NotificationIcon);
