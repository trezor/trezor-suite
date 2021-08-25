import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation, TrezorLink } from '@suite-components';
import { variables, Button, Select, Link } from '@trezor/components';
import { URLS } from '@suite-constants';
import { getLinuxPackage } from '@suite-utils/bridge';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Download = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Manual = styled(Download)`
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const StyledButton = styled(Button)`
    margin-left: 12px;
    min-width: 280px;
`;

interface Installer {
    label: string;
    value: string;
    preferred?: boolean;
}

const UdevDownload = () => {
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
        <Wrapper>
            <Download>
                <Select
                    noTopLabel
                    isSearchable={false}
                    isClearable={false}
                    value={target}
                    variant="small"
                    onChange={setSelectedTarget}
                    options={installers}
                />

                <Link variant="nostyle" href={target.value}>
                    <StyledButton>
                        <Translation id="TR_DOWNLOAD" />
                    </StyledButton>
                </Link>
            </Download>
            <Manual>
                <Translation id="TR_UDEV_DOWNLOAD_MANUAL" />
                <TrezorLink variant="nostyle" href={URLS.WIKI_UDEV_RULES}>
                    <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                        <Translation id="TR_LEARN_MORE" />
                    </Button>
                </TrezorLink>
            </Manual>
        </Wrapper>
    );
};

export default UdevDownload;
