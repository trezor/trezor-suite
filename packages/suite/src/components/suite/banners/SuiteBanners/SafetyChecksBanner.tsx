import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { Banner } from '../Banner';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface SafetyChecksBannerProps {
    onDismiss?: () => void;
}

export const SafetyChecksBanner = ({ onDismiss }: SafetyChecksBannerProps) => {
    const dispatch = useDispatch();

    const action = {
        label: <Translation id="TR_SAFETY_CHECKS_BANNER_CHANGE" />,
        onClick: () =>
            dispatch(
                goto('settings-device', {
                    preserveParams: true,
                    anchor: SettingsAnchor.SafetyChecks,
                }),
            ),
        'data-test-id': '@banner/safety-checks/button',
    };

    return (
        <Banner
            variant="warning"
            body={<Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />}
            action={action}
            dismissal={
                onDismiss
                    ? {
                          onClick: onDismiss,
                          'data-test-id': '@banner/safety-checks/dismiss',
                      }
                    : undefined
            }
        />
    );
};
