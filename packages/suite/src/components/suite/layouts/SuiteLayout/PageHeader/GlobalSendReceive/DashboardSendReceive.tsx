import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk, parseDashboardParams, selectRouterParams } from '@suite/router';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { GlobalSendReceiveView } from './GlobalSendReceiveView';

export const DashboardSendReceive = () => {
    const routerParams = useSelector(selectRouterParams);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const activeModal = parseDashboardParams(routerParams)?.modal ?? null;

    const handleOpen = (modal: NonNullable<GlobalSendReceiveType>) => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: modal, from: 'dashboard/header' },
        });
        dispatch(gotoThunk({ routeName: 'suite-index', params: { modal } }));
    };

    const handleClose = () => {
        dispatch(gotoThunk({ routeName: 'suite-index' }));
    };

    return (
        <GlobalSendReceiveView
            activeModal={activeModal}
            onOpen={handleOpen}
            onClose={handleClose}
        />
    );
};
