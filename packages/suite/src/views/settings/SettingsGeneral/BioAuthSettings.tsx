import { useEffect } from 'react';

import styled from 'styled-components';

import { Switch, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import {
    checkBioAuthAvailableThunk,
    requestBioAuthChangeThunk,
} from 'src/actions/suite/bioAuthThunks';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import {
    selectBioAuthChangeNextValue,
    selectBioAuthEnabled,
    selectIsBioAuthAvailable,
    selectIsBioAuthAvailableStateKnown,
    selectIsRequestingBioAuthChange,
} from 'src/reducers/bioAuth';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const BioAuthSettings = () => {
    const biometricAuthEnabled = useSelector(selectBioAuthEnabled);
    const isRequestingBioAuthChange = useSelector(selectIsRequestingBioAuthChange);
    const bioAuthChangeNextValue = useSelector(selectBioAuthChangeNextValue);
    const isBioAuthStateKnown = useSelector(selectIsBioAuthAvailableStateKnown);
    const isBioAuthAvailable = useSelector(selectIsBioAuthAvailable);
    const optimisticValue = bioAuthChangeNextValue ?? biometricAuthEnabled;
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const onChange = (nextBioAuthEnabledValue: boolean) => {
        dispatch(requestBioAuthChangeThunk({ translationString, nextBioAuthEnabledValue }));
        analytics.report({
            type: EventType.SettingsGeneralBioAuth,
            payload: {
                value: nextBioAuthEnabledValue,
            },
        });
    };

    useEffect(() => {
        dispatch(checkBioAuthAvailableThunk());
    }, [dispatch]);

    const tooltipActive = !isBioAuthStateKnown || !isBioAuthAvailable;

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
                        isFullWidth
                        placement="bottom"
                        cursor={tooltipActive ? 'not-allowed' : undefined}
                        content={
                            !isBioAuthStateKnown ? (
                                <Translation id="TR_BIO_AUTH_STATE_UNKNOWN_TOOLTIP" />
                            ) : (
                                <Translation id="TR_BIO_AUTH_UNAVAILABLE_TOOLTIP" />
                            )
                        }
                    >
                        <Switch
                            isDisabled={isRequestingBioAuthChange || tooltipActive}
                            data-testid="@bioAuth/toggle-switch"
                            isChecked={optimisticValue}
                            onChange={onChange}
                        />
                    </Tooltip>
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
