import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { goto, selectRouterParams } from '@suite/router';
import { useSelector } from '@suite-common/redux-utils';
import { yup } from '@suite-common/validators';
import { type Account, type GlobalSendReceiveType } from '@suite-common/wallet-types';

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
        dispatch(goto({ routeName: 'suite-index', params: { modal } }));
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
            dispatch(goto({ routeName: 'suite-index' }));
        }
    };

    return {
        activeModal,
        openModal,
        closeModal,
    };
}
