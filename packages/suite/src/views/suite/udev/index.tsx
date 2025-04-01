import { useState } from 'react';

import { Column, NewModal, Paragraph, Select, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { DATA_URL, HELP_CENTER_UDEV_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { useExternalLink, useSelector } from 'src/hooks/suite';
import { selectUdevInstaller } from 'src/reducers/suite/suiteReducer';
import type { ForegroundAppProps } from 'src/types/suite';

type Installer = {
    label: string;
    value: string;
    preferred?: boolean;
};

export const UdevRules = ({ onCancel }: ForegroundAppProps) => {
    const udev = useSelector(selectUdevInstaller);
    const udevManualUrl = useExternalLink(HELP_CENTER_UDEV_URL);

    const installers: Installer[] = udev
        ? udev.packages.map(p => ({
              label: p.name,
              value: DATA_URL + p.url.substring(1),
              preferred: p.preferred,
          }))
        : [];

    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);
    const preferredTarget = installers.find(i => i.preferred);
    const target = selectedTarget || preferredTarget || installers[0];

    return (
        <NewModal
            data-testid="@modal/udev"
            onCancel={onCancel}
            heading={<Translation id="TR_UDEV_DOWNLOAD_TITLE" />}
            bottomContent={
                <>
                    <NewModal.Button href={target.value}>
                        <Translation id="TR_DOWNLOAD" />
                    </NewModal.Button>
                    <NewModal.Button
                        variant="tertiary"
                        href={udevManualUrl}
                        icon="arrowUpRight"
                        iconAlignment="end"
                        iconSize={20}
                    >
                        <Translation id="TR_UDEV_DOWNLOAD_MANUAL" />
                    </NewModal.Button>
                </>
            }
            size="small"
        >
            <Column gap={spacings.sm}>
                <Paragraph variant="tertiary">
                    <Translation id="TR_UDEV_DOWNLOAD_DESC" />
                </Paragraph>
                {target ? (
                    <>
                        <Select
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            onChange={setSelectedTarget}
                            options={installers}
                        />
                    </>
                ) : (
                    <>
                        <Spinner size={24} />
                        <Translation id="TR_GATHERING_INFO" />
                    </>
                )}
            </Column>
        </NewModal>
    );
};
