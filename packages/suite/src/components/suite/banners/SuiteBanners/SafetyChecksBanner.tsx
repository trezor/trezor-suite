import { Translation } from '@suite/intl';
import { SettingsAnchor, gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { XIcon } from '@trezor/icons';

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
                        onClick={() =>
                            dispatch(
                                gotoThunk({
                                    routeName: 'settings-device',
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
                            icon={XIcon}
                            onClick={onDismiss}
                            data-testid="@banner/safety-checks/dismiss"
                            tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                        />
                    )}
                </>
            }
            description={<Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />}
        />
    );
};
