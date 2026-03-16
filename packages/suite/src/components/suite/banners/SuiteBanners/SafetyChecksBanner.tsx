import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Banner } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

type SafetyChecksBannerProps = {
    onDismiss?: () => void;
};

export const SafetyChecksBanner = ({ onDismiss }: SafetyChecksBannerProps) => {
    const dispatch = useDispatch();

    return (
        <Banner
            data-testid="@banner/safety-checks"
            icon
            intent="warning"
            rightContent={
                <>
                    <Banner.Button
                        onClick={e => {
                            e.stopPropagation();
                            dispatch(
                                goto('settings-device', {
                                    preserveParams: true,
                                    anchor: SettingsAnchor.SafetyChecks,
                                }),
                            );
                        }}
                        data-testid="@banner/safety-checks/button"
                    >
                        <Translation id="TR_SAFETY_CHECKS_BANNER_CHANGE" />
                    </Banner.Button>
                    {onDismiss && (
                        <Banner.IconButton
                            icon="x"
                            onClick={e => {
                                e.stopPropagation();
                                onDismiss();
                            }}
                            data-testid="@banner/safety-checks/dismiss"
                        />
                    )}
                </>
            }
            description={<Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />}
        />
    );
};
