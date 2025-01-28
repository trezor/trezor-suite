import { Banner, Row, Banner as WarningComponent } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch } from 'src/hooks/suite';

interface SafetyChecksBannerProps {
    onDismiss?: () => void;
}

export const SafetyChecksBanner = ({ onDismiss }: SafetyChecksBannerProps) => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            variant="warning"
            rightContent={
                <Row gap={8}>
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
                        <WarningComponent.IconButton
                            icon="x"
                            onClick={onDismiss}
                            isSubtle
                            data-testid="@banner/safety-checks/dismiss"
                        />
                    )}
                </Row>
            }
        >
            <Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />
        </Banner>
    );
};
