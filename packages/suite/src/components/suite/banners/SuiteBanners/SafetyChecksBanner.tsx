import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { Row, Banner as WarningComponent, Banner } from '@trezor/components';

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
                            icon="close"
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
