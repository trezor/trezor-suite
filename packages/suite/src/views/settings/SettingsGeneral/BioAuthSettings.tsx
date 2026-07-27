import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { Switch, Tooltip } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useBioAuthDesktopApi } from 'src/hooks/suite/useBioAuthDesktopApi';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const BioAuthSettings = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
        <Anchor anchorId={SettingsAnchor.BioAuth}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
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
                </SectionItem>
            )}
        </Anchor>
    );
};
