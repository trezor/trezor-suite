import { useEffect, useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import {
    phishingActions,
    selectDustPhishingIsEnabled,
    selectDustPhishingThreshold,
} from '@suite-common/wallet-core';
import { Button, Input, Row, Switch, Text } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const DustPhishing = () => {
    const dispatch = useDispatch();

    const dustPhishingIsEnabled = useSelector(selectDustPhishingIsEnabled);
    const dustPhishingThreshold = useSelector(selectDustPhishingThreshold);

    const [dustThreshold, setDustThreshold] = useState(dustPhishingThreshold);

    useEffect(() => {
        setDustThreshold(dustPhishingThreshold);
    }, [dustPhishingIsEnabled, dustPhishingThreshold]);

    const errorMessage = useMemo(() => {
        if (dustThreshold.trim() === '') {
            return 'TR_DUST_PHISHING_ERROR_EMPTY';
        }

        const number = Number(dustThreshold.trim());

        if (isNaN(number)) {
            return 'TR_DUST_PHISHING_ERROR_NUMBER';
        }

        if (number <= 0) {
            return 'TR_DUST_PHISHING_ERROR_POSITIVE';
        }

        return undefined;
    }, [dustThreshold]);

    const isSame = dustThreshold.trim() === dustPhishingThreshold;
    const isDisabled = !!errorMessage || isSame;

    const onConfirm = () => {
        if (isDisabled) return;
        dispatch(
            phishingActions.setDustPhishing({
                isEnabled: dustPhishingIsEnabled,
                dustThreshold: dustThreshold.trim(),
            }),
        );
    };

    const onSwitchChange = (value: boolean) => {
        dispatch(
            phishingActions.setDustPhishing({
                isEnabled: value,
                dustThreshold: dustPhishingThreshold,
            }),
        );
    };

    return (
        <>
            <SettingsSectionItem anchorId={SettingsAnchor.DustPhishing}>
                <TextColumn
                    title={<Translation id="TR_DUST_PHISHING_PROTECTION" />}
                    description={<Translation id="TR_DUST_PHISHING_PROTECTION_DESCRIPTION" />}
                />
                <ActionColumn>
                    <Switch
                        isChecked={dustPhishingIsEnabled}
                        onChange={onSwitchChange}
                        data-testid="@settings/auto-eject-switch"
                    />
                </ActionColumn>
            </SettingsSectionItem>

            {dustPhishingIsEnabled && (
                <SettingsSectionItem anchorId={SettingsAnchor.DustPhishingThreshold}>
                    <TextColumn
                        title={<Translation id="TR_DUST_PHISHING_THRESHOLD" />}
                        description={<Translation id="TR_DUST_PHISHING_THRESHOLD_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <Row gap={6} alignItems="start">
                            <Input
                                value={dustThreshold}
                                size="small"
                                onChange={e => setDustThreshold(e.target.value)}
                                hasError={!!errorMessage}
                                bottomText={
                                    errorMessage ? <Translation id={errorMessage} /> : undefined
                                }
                                rightContent={<Text color="textSubdued">USD</Text>}
                                width={125}
                            />

                            <Button
                                size="medium"
                                intent="brand"
                                onClick={onConfirm}
                                isDisabled={isDisabled}
                            >
                                <Translation id="TR_SAVE" />
                            </Button>
                        </Row>
                    </ActionColumn>
                </SettingsSectionItem>
            )}
        </>
    );
};
