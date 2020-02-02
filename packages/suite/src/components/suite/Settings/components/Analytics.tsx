import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Switch } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SUITE } from '@suite-actions/constants';
import { Section, ActionColumn, Row, TextColumn } from '@suite-components/Settings';
import { AppState, Dispatch } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
    analytics: state.suite.analytics,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    toggleAnalytics: bindActionCreators(analyticsActions.toggleAnalytics, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Analytics = ({ locks, analytics, toggleAnalytics }: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <Section borderless>
            <Row>
                <TextColumn
                    title={<Translation>{messages.TR_ALLOW_ANALYTICS}</Translation>}
                    description={
                        <Translation>{messages.TR_ALLOW_ANALYTICS_DESCRIPTION}</Translation>
                    }
                    learnMore="todo some link"
                />
                <ActionColumn>
                    <Switch checked={analytics} onChange={toggleAnalytics} isDisabled={uiLocked} />
                </ActionColumn>
            </Row>
        </Section>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Analytics);
