import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Switch } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

import { SUITE } from '@suite-actions/constants';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { AppState, Dispatch } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
    enabled: state.analytics.enabled,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    init: bindActionCreators(analyticsActions.init, dispatch),
    dispose: bindActionCreators(analyticsActions.dispose, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Analytics = ({ locks, enabled, init, dispose }: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_ALLOW_ANALYTICS" />}
                description={<Translation id="TR_ALLOW_ANALYTICS_DESCRIPTION" />}
                // todo: disabled until we get where to redirect
                // learnMore="todo some link"
            />
            <ActionColumn>
                <Switch
                    checked={enabled}
                    onChange={() => {
                        if (enabled) {
                            return dispose();
                        }
                        init();
                    }}
                    isDisabled={uiLocked}
                />
            </ActionColumn>
        </SectionItem>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Analytics);
