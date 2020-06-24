import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Modal, Button, Link, Select } from '@trezor/components';
import { URLS } from '@suite-constants';
import { getLinuxPackage } from '@suite-utils/bridge';
import { InjectedModalApplicationProps } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 780px;
`;

const Download = styled.div`
    margin: 24px auto;
    display: flex;
    justify-content: center;
    align-content: center;
    flex-direction: column;
`;

const StyledButton = styled(Button)`
    margin-top: 12px;
    min-width: 280px;
`;

interface Installer {
    label: string;
    value: string;
    preferred?: boolean;
}

export default (props: InjectedModalApplicationProps) => {
    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);
    const linuxPackage = getLinuxPackage();
    // TODO: this data should be a part of TRANSPORT.START event from trezor-connect (same as bridge installers)
    // there is no point to move this logic into config/constants
    // leaving hard coded for now until it's available from connect
    const installers = [
        {
            label: 'RPM package',
            value: 'https://data.trezor.io/udev/trezor-udev-2-1.noarch.rpm',
            preferred: linuxPackage === 'rpm',
        },
        {
            label: 'DEB package',
            value: 'https://data.trezor.io/udev/trezor-udev_2_all.deb',
            preferred: linuxPackage === 'deb',
        },
    ];
    const preferredTarget = installers.find(i => i.preferred);
    const target = selectedTarget || preferredTarget || installers[0];

    return (
        <Modal
            data-test="@modal/udev"
            cancelable
            onCancel={props.onCancel}
            heading={<Translation id="TR_UDEV_DOWNLOAD_TITLE" />}
            description={<Translation id="TR_UDEV_DOWNLOAD_DESC" />}
        >
            <Wrapper>
                <Download>
                    <Select
                        isSearchable={false}
                        isClearable={false}
                        value={target}
                        variant="small"
                        onChange={setSelectedTarget}
                        options={installers}
                        maxMenuHeight={160}
                    />

                    <Link variant="nostyle" href={target.value}>
                        <StyledButton>
                            <Translation id="TR_DOWNLOAD" />
                        </StyledButton>
                    </Link>
                    <Link variant="nostyle" href={URLS.WIKI_UDEV_RULES}>
                        <StyledButton variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                            <Translation id="TR_UDEV_DOWNLOAD_MANUAL" />
                        </StyledButton>
                    </Link>
                </Download>
            </Wrapper>
        </Modal>
    );
};
