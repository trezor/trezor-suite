import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { Row, Warning as WarningComponent, Warning } from '@trezor/components';

interface SafetyChecksBannerProps {
    onDismiss?: () => void;
}

export const SafetyChecksBanner = ({ onDismiss }: SafetyChecksBannerProps) => {
    const dispatch = useDispatch();

    return (
        <Warning
            icon
            variant="warning"
            rightContent={
                <Row gap={8}>
                    <Warning.Button
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
                    </Warning.Button>
                    {onDismiss && (
                        <WarningComponent.IconButton
                            icon="CROSS"
                            onClick={onDismiss}
                            isSubtle
                            data-testid="@banner/safety-checks/dismiss"
                        />
                    )}
                </Row>
            }
        >
            <Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />
        </Warning>
    );
};
