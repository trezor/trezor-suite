import { Card, Checkbox, Column, Markdown, NewModal, Paragraph, H4 } from '@trezor/components';
import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { download } from 'src/actions/suite/desktopUpdateActions';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { setFlag } from 'src/actions/suite/suiteActions';

import { getVersionName } from './getVersionName';

interface AvailableProps {
    onCancel: () => void;
    latest: UpdateInfo | undefined;
}

export const Available = ({ onCancel, latest }: AvailableProps) => {
    const dispatch = useDispatch();
    const { enableAutoupdateOnNextRun } = useSelector(selectSuiteFlags);

    const downloadUpdate = () => {
        dispatch(download());
        desktopApi.downloadUpdate();
    };

    const suiteCurrentVersion = process.env.VERSION || '';
    const suiteNewVersion = getVersionName({
        latestVersion: latest?.version,
        prerelease: !!latest?.prerelease,
    });

    const handleToggleAutoUpdateClick = () =>
        dispatch(setFlag('enableAutoupdateOnNextRun', !enableAutoupdateOnNextRun));

    return (
        <NewModal
            heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
            description={
                <Translation
                    id="TR_UPDATE_MODAL_YOUR_VERSION"
                    values={{ version: suiteCurrentVersion }}
                />
            }
            onCancel={onCancel}
            bottomContent={
                <>
                    <NewModal.Button onClick={downloadUpdate}>
                        <Translation id="TR_UPDATE_MODAL_START_DOWNLOAD" />
                    </NewModal.Button>
                    <NewModal.Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_UPDATE_MODAL_NOT_NOW" />
                    </NewModal.Button>
                </>
            }
        >
            <Column>
                <H4>
                    <Translation
                        id="TR_VERSION_HAS_BEEN_RELEASED"
                        values={{ version: suiteNewVersion }}
                    />
                </H4>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    <Translation id="TR_WERE_CONSTANTLY_WORKING_TO_IMPROVE" />
                </Paragraph>
                <Card maxHeight={400} overflow="auto" margin={{ top: spacings.sm }}>
                    {latest?.changelog ? (
                        <Markdown>{latest?.changelog}</Markdown>
                    ) : (
                        <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                    )}
                </Card>
            </Column>

            <Card margin={{ top: spacings.xxl }}>
                <Checkbox
                    isChecked={enableAutoupdateOnNextRun}
                    onClick={handleToggleAutoUpdateClick}
                >
                    <Translation id="TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES" />
                </Checkbox>
            </Card>
        </NewModal>
    );
};
