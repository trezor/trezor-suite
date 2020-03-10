import React from 'react';
import { connect } from 'react-redux';
import { NotificationCard, Translation } from '@suite-components';

import { AppState } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

export type Props = ReturnType<typeof mapStateToProps>;

const Disconnected = ({ device }: Props) => {
    const deviceLabel = device ? device.label : '';
    return (
        <NotificationCard variant="info">
            <Translation id="TR_DEVICE_LABEL_IS_DISCONNECTED} values={{ deviceLabel }" />
        </NotificationCard>
    );
};

export default connect(mapStateToProps)(Disconnected);
