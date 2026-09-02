import { useEffect, useState } from 'react';

import { gotoThunk, selectRouterParams } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { yup } from '@suite-common/validators';
import { type Account, type GlobalSendReceiveType } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { type Route } from 'src/types/suite';

import { useGoToWithAnalytics } from '../../useGoToWithAnalytics';

export const dashboardParamsSchema = yup
    .object({
        modal: yup
            .mixed<NonNullable<GlobalSendReceiveType>>()
            .oneOf(['send', 'receive'])
            .required(),
    })
    .notRequired();

export const getDashboardParamModal = (param: unknown): GlobalSendReceiveType => {
    const hasModalParam =
        typeof param === 'object' && param !== null && !Array.isArray(param) && 'modal' in param;

    if (!hasModalParam) {
        return null;
    }

    try {
        const parsedParams = dashboardParamsSchema.validateSync(param, {
            abortEarly: false,
            strict: true,
        });

        return parsedParams?.modal ?? null;
    } catch {
        return null;
    }
};

export function useGlobalSendReceiveModal() {
    const dispatch = useDispatch();
    const goToWithAnalytics = useGoToWithAnalytics();
    const routerParams = useSelector(selectRouterParams);
    const [activeModal, setActiveModal] = useState<GlobalSendReceiveType>(null);

    useEffect(() => {
        setActiveModal(getDashboardParamModal(routerParams));
    }, [routerParams]);

    const openModal = (modal: NonNullable<GlobalSendReceiveType>) => {
        setActiveModal(modal);
        dispatch(gotoThunk({ routeName: 'suite-index', params: { modal } }));
    };

    const closeModal = (routeName?: Route['name'], account?: Account) => {
        setActiveModal(null);

        if (routeName && account) {
            goToWithAnalytics({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            });
        } else {
            dispatch(gotoThunk({ routeName: 'suite-index' }));
        }
    };

    return {
        activeModal,
        openModal,
        closeModal,
    };
}
