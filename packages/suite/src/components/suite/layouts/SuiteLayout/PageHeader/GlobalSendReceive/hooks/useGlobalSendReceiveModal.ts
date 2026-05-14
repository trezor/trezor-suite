import { useEffect, useState } from 'react';

import { goto, selectRouterParams } from '@suite/router';
import { yup } from '@suite-common/validators';
import { type Account, type GlobalSendReceiveType } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
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

const getDashboardParamModal = (param: unknown): GlobalSendReceiveType => {
    try {
        const parsedParams = dashboardParamsSchema.validateSync(param, {
            abortEarly: false,
            strict: true,
        });

        return parsedParams?.modal ?? null;
    } catch (error) {
        console.error(error);
    }

    return null;
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
