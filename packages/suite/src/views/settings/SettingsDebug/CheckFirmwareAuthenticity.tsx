import { Switch } from '@trezor/components';

import { SUITE } from 'src/actions/suite/constants';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectIsEntropyCheckEnabled,
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
} from 'src/reducers/suite/suiteReducer';

export const CheckFirmwareAuthenticity = () => {
    const dispatch = useDispatch();
    const isEntropyCheckEnabled = useSelector(selectIsEntropyCheckEnabled);
    const isFirmwareHashCheckEnabled = useSelector(selectIsFirmwareHashCheckEnabled);
    const isFirmwareRevisionCheckEnabled = useSelector(selectIsFirmwareRevisionCheckEnabled);

    const toggleEntropyCheck = (isChecked?: boolean) =>
        dispatch({
            type: SUITE.TOGGLE_ENTROPY_CHECK,
            payload: !!isChecked,
        });
    const toggleFirmwareHashCheck = (isChecked?: boolean) =>
        dispatch({
            type: SUITE.TOGGLE_FIRMWARE_HASH_CHECK,
            payload: !!isChecked,
        });
    const toggleFirmwareRevisionCheck = (isChecked?: boolean) =>
        dispatch({
            type: SUITE.TOGGLE_FIRMWARE_REVISION_CHECK,
            payload: !!isChecked,
        });

    return (
        <>
            <SectionItem>
                <TextColumn
                    title="Check entropy on wallet creation"
                    description="Carry out entropy check when a wallet is created."
                />
                <ActionColumn>
                    <Switch onChange={toggleEntropyCheck} isChecked={isEntropyCheckEnabled} />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Check firmware Hash regularly"
                    description="Carry out firmware hash check every time you authorize Trezor device."
                />
                <ActionColumn>
                    <Switch
                        onChange={toggleFirmwareHashCheck}
                        isChecked={isFirmwareHashCheckEnabled}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn
                    title="Check firmware Revision regularly"
                    description="Carry out firmware revision check every time you authorize Trezor device."
                />
                <ActionColumn>
                    <Switch
                        onChange={toggleFirmwareRevisionCheck}
                        isChecked={isFirmwareRevisionCheckEnabled}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
