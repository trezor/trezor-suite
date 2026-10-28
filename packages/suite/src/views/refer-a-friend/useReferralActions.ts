import { useTranslation } from '@suite/intl';
import {
    deriveReferralKeyThunk,
    joinReferralProgramThunk,
    leaveReferralProgramThunk,
} from '@suite-common/refer-a-friend';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type ReferralActionThunk =
    | typeof joinReferralProgramThunk
    | typeof deriveReferralKeyThunk
    | typeof leaveReferralProgramThunk;

export const useReferralActions = (deviceId: string | undefined) => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const runReferralAction = async (thunk: ReferralActionThunk) => {
        if (deviceId === undefined) return;

        const result = await dispatch(thunk({ deviceId })).unwrap();

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error:
                        result.error.message ||
                        result.error.code ||
                        translationString('TR_REFERRAL_ERROR_GENERIC'),
                }),
            );
        }
    };

    return {
        join: () => runReferralAction(joinReferralProgramThunk),
        deriveKey: () => runReferralAction(deriveReferralKeyThunk),
        leave: () => runReferralAction(leaveReferralProgramThunk),
    };
};
