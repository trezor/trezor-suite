import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { phishingActions, selectPhishingDustThreshold } from '@suite-common/wallet-core';
import { Button, Column, Input } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const DustPhishing = () => {
    const dispatch = useDispatch();

    const phishingDustThreshold = useSelector(selectPhishingDustThreshold);

    const [dustThreshold, setDustThreshold] = useState(phishingDustThreshold ?? '');

    const errorMessage = useMemo(() => {
        if (dustThreshold.trim() === '') return undefined;

        const number = Number(dustThreshold.trim());

        if (isNaN(number)) {
            return 'TR_DUST_PHISHING_ERROR_NUMBER';
        }

        if (number <= 0) {
            return 'TR_DUST_PHISHING_ERROR_POSITIVE';
        }

        return undefined;
    }, [dustThreshold]);

    const isSame = dustThreshold.trim() === (phishingDustThreshold ?? '');
    const isButtonDisabled = !!errorMessage || isSame;
    const isTurningOff = dustThreshold.trim() === '' && !isSame;

    const onSaveClick = () => {
        if (isButtonDisabled) return;

        dispatch(
            phishingActions.setDustThreshold({
                dustThreshold: dustThreshold.trim() === '' ? undefined : dustThreshold.trim(),
            }),
        );
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.DustPhishing}>
            <TextColumn
                title={<Translation id="TR_DUST_PHISHING" />}
                description={<Translation id="TR_DUST_PHISHING_DESCRIPTION" />}
            />
            <ActionColumn>
                <Column gap={4}>
                    <Input
                        value={dustThreshold}
                        placeholder="e.g. 0.005"
                        onChange={e => setDustThreshold(e.target.value)}
                        hasError={!!errorMessage}
                        rightContent={
                            <Button
                                onClick={onSaveClick}
                                intent={isTurningOff ? 'warning' : 'brand'}
                                priority="primary"
                                size="small"
                                isDisabled={isButtonDisabled}
                            >
                                <Translation id={isTurningOff ? 'TR_TURN_OFF' : 'TR_SAVE'} />
                            </Button>
                        }
                        bottomText={errorMessage ? <Translation id={errorMessage} /> : undefined}
                    />
                </Column>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
