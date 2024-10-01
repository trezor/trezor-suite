import styled from 'styled-components';

import {
    Card,
    Checkbox,
    Column,
    Icon,
    Markdown,
    NewModal,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { download } from 'src/actions/suite/desktopUpdateActions';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { setFlag } from 'src/actions/suite/suiteActions';

import { Changelog } from './changelogComponents';
import { getVersionName } from './getVersionName';

const GreenTag = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation0};
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs};
`;

const NewTag = () => (
    <GreenTag>
        <Icon name="sparkleFilled" variant="primary" size="small" />
        <Text variant="primary">
            <Translation id="TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES_NEW_TAG" />
        </Text>
    </GreenTag>
);

interface AvailableProps {
    onCancel: () => void;
    latest: UpdateInfo | undefined;
}

export const Available = ({ onCancel, latest }: AvailableProps) => {
    const dispatch = useDispatch();
    const { turnAutoUpdateOnNextRun } = useSelector(selectSuiteFlags);

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
        dispatch(setFlag('turnAutoUpdateOnNextRun', !turnAutoUpdateOnNextRun));

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
            <Column gap={spacings.xs} alignItems="start">
                <div>
                    <Paragraph typographyStyle="highlight" variant="primary">
                        <Translation
                            id="TR_VERSION_HAS_RELEASED"
                            values={{ version: suiteNewVersion }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="hint" variant="tertiary">
                        <Translation id="TR_WERE_CONSTANTLY_WORKING_TO_IMPROVE" />
                    </Paragraph>
                </div>

                <Changelog>
                    {latest?.changelog ? (
                        <Markdown>{latest?.changelog}</Markdown>
                    ) : (
                        <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                    )}
                </Changelog>

                <Row justifyContent="end" width="100%">
                    {latest?.releaseDate && <Text variant="tertiary">{latest?.releaseDate}</Text>}
                </Row>

                <Card>
                    <Row justifyContent="start" gap={spacings.xs}>
                        <Checkbox
                            isChecked={turnAutoUpdateOnNextRun}
                            onClick={handleToggleAutoUpdateClick}
                        >
                            <Translation id="TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES" />
                        </Checkbox>
                        <NewTag />
                    </Row>
                </Card>
            </Column>
        </NewModal>
    );
};
