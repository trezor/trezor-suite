import { Banner } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch } from 'src/hooks/suite';

type SafetyChecksBannerProps = {
    onDismiss?: () => void;
};

export const SafetyChecksBanner = ({ onDismiss }: SafetyChecksBannerProps) => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            intent="warning"
            rightContent={
                <>
                    <Banner.Button
                        onClick={() =>
                            dispatch(
                                goto('settings-device', {
                                    preserveParams: true,
                                    anchor: SettingsAnchor.SafetyChecks,
                                }),
                            )
                        }
                        data-testid="@banner/safety-checks/button"
                    >
                        <Translation id="TR_SAFETY_CHECKS_BANNER_CHANGE" />
                    </Banner.Button>
                    {onDismiss && (
                        <Banner.IconButton
                            icon="x"
                            onClick={onDismiss}
                            data-testid="@banner/safety-checks/dismiss"
                        />
                    )}
                </>
            }
        >
            <Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />
        </Banner>
    );
};
