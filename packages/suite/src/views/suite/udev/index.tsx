import { useState } from 'react';

import { Translation } from '@suite/intl';
import { getOsFamily, getUserAgent } from '@suite-common/suite-utils';
import { Column, Modal, Paragraph, Select, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { DATA_URL, HELP_CENTER_UDEV_URL } from '@trezor/urls';

import { useExternalLink } from 'src/hooks/suite';
import type { ForegroundAppProps } from 'src/types/suite';

type Installer = {
    label: string;
    value: string;
    preferred?: boolean;
};

interface UdevInfo {
    packages: {
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }[];
}

type InstallerPackage = 'rpm32' | 'rpm64' | 'deb32' | 'deb64' | 'mac' | 'win32' | 'win64';

const udev: UdevInfo = {
    packages: [
        {
            name: 'RPM package',
            platform: ['rpm32', 'rpm64'],
            url: '/udev/trezor-udev-2-1.noarch.rpm',
        },
        {
            name: 'DEB package',
            platform: ['deb32', 'deb64'],
            url: '/udev/trezor-udev_2_all.deb',
            preferred: true, // DEB package is the most common
        },
    ],
};

export const getInstallerPackage = (): InstallerPackage | undefined => {
    const agent = getUserAgent();

    switch (getOsFamily()) {
        case 'MacOS':
            return 'mac';
        case 'Windows': {
            const arch = agent.match(/(Win64|WOW64)/) ? '64' : '32';

            return `win${arch}`;
        }
        case 'Linux': {
            const isRpm = agent.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/)
                ? 'rpm'
                : 'deb';
            const is64x = agent.match(/Linux i[3456]86/) ? '32' : '64';

            return `${isRpm}${is64x}`;
        }
        default:
        // no default, type safe
    }
};

export const UdevRules = ({ onCancel }: ForegroundAppProps) => {
    const udevManualUrl = useExternalLink(HELP_CENTER_UDEV_URL);

    const platform = getInstallerPackage();
    const installers: Installer[] = udev.packages.map(p => ({
        label: p.name,
        value: DATA_URL + p.url.substring(1),
        preferred: platform ? p.platform.indexOf(platform) >= 0 : false,
    }));
    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);
    const preferredTarget = installers.find(i => i.preferred);
    const target = selectedTarget || preferredTarget || installers[0];

    return (
        <Modal
            data-testid="@modal/udev"
            onCancel={onCancel}
            heading={<Translation id="TR_UDEV_DOWNLOAD_TITLE" />}
            bottomContent={
                <>
                    <Modal.Button href={target?.value}>
                        <Translation id="TR_DOWNLOAD" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" href={udevManualUrl}>
                        <Translation id="TR_UDEV_DOWNLOAD_MANUAL" />
                    </Modal.Button>
                </>
            }
            width={600}
        >
            <Column gap={spacings.sm}>
                <Paragraph intent="neutral" priority="secondary">
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
                        <Spinner size={24} isDisabled={true} />
                        <Translation id="TR_GATHERING_INFO" />
                    </>
                )}
            </Column>
        </Modal>
    );
};
