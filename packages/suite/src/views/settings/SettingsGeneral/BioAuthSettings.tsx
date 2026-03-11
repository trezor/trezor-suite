import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Switch, Tooltip } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { useBioAuthDesktopApi } from 'src/hooks/suite/useBioAuthDesktopApi';
import { useAnalytics } from 'src/support/useAnalytics';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const BioAuthSettings = () => {
    const analytics = useAnalytics();
    const {
        isBioAuthEnabled,
        isBioAuthAvailable,
        requestBioAuthChange,
        optimisticUpdateIsBioAuthEnabled,
        isCallInProgress,
    } = useBioAuthDesktopApi();

    const onChange = (nextBioAuthEnabledValue: boolean) => {
        requestBioAuthChange();
        analytics.report({
            type: events.settingsGeneralBioAuthEvent.name,
            payload: {
                value: nextBioAuthEnabledValue,
            },
        });
    };

    const tooltipActive = isBioAuthAvailable === false;

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AddressDisplay}>
            <TextColumn
                title={<Translation id="TR_BIO_AUTH" />}
                description={<Translation id="TR_BIO_AUTH_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Tooltip
                        isActive={tooltipActive}
                        width="100%"
                        placement="bottom"
                        cursor={tooltipActive ? 'not-allowed' : undefined}
                        content={
                            isBioAuthAvailable === null ? (
                                <Translation id="TR_BIO_AUTH_STATE_UNKNOWN_TOOLTIP" />
                            ) : (
                                <Translation id="TR_BIO_AUTH_UNAVAILABLE_TOOLTIP" />
                            )
                        }
                    >
                        <Switch
                            isDisabled={isCallInProgress || tooltipActive}
                            data-testid="@bioAuth/toggle-switch"
                            isChecked={optimisticUpdateIsBioAuthEnabled ?? isBioAuthEnabled}
                            onChange={onChange}
                        />
                    </Tooltip>
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
