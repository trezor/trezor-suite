import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { Dispatch } from '@suite-types';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <DeviceInvalidModeLayout
        title={<Translation id="TR_UNREADABLE" />}
        text={<Translation id="TR_UNREADABLE_EXPLAINED" />}
        resolveButton={
            <Button onClick={() => props.goto('suite-bridge')}>
                <Translation id="TR_SEE_DETAILS" />
            </Button>
        }
        allowSwitchDevice
    />
);

export default connect(null, mapDispatchToProps)(Index);
