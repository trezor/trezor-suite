import { useSelector } from 'react-redux';

import { gotoThunk, parseDashboardParams, selectRouterParams } from '@suite/router';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { GlobalSendReceiveView } from './GlobalSendReceiveView';
import { useGlobalSendReceiveAnalytics } from './hooks/useGlobalSendReceiveAnalytics';

export const DashboardSendReceive = () => {
    const routerParams = useSelector(selectRouterParams);
    const { dispatch } = useServices(injectDispatch);
    const { reportOpen } = useGlobalSendReceiveAnalytics();

    const activeModal = parseDashboardParams(routerParams)?.modal ?? null;

    const handleOpen = (modal: NonNullable<GlobalSendReceiveType>) => {
        reportOpen(modal, 'page-header');
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
