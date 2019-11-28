import { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateOnlineStatus } from '@suite-actions/suiteActions';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    updateOnlineStatus: bindActionCreators(updateOnlineStatus, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

/**
 * Navigator online/offline handler used in suite-web and suite-desktop apps
 * Handle changes of state and dispatch Action with current state to the reducer
 * @param {Props} props
 */
const OnlineStatus = (props: Props) => {
    useEffect(() => {
        const statusHandler = () => {
            props.updateOnlineStatus(navigator.onLine);
        };

        // handle browser back button
        window.addEventListener('online', statusHandler);
        window.addEventListener('offline', statusHandler);

        statusHandler();

        return () => {
            window.removeEventListener('online', statusHandler, false);
            window.removeEventListener('offline', statusHandler, false);
        };
    });

    return null;
};

export default connect(null, mapDispatchToProps)(OnlineStatus);
