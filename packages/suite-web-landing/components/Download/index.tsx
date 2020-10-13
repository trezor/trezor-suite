import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Dropdown, Icon, colors, variables, Link } from '@trezor/components';
import { IconType } from '@trezor/components/src/support/types';
import { Platform, getPlatform } from '../../utils/navigator';
import { normalizeVersion } from '@suite-utils/build';

const StyledDropdown = styled(Dropdown)`
    & ul {
        padding-top: 6px;
        padding-bottom: 6px;
    }
`;

const StyledDropdownButton = styled(Button)`
    && {
        height: 100%;
        display: flex;
        border-right: 1px solid rgba(255, 255, 255, 0.38);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
`;

const StyledDownloadButton = styled(Button)`
    && {
        padding: 0;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
    & > a {
        padding: 9px 15px;
    }
`;

const DropdownItem = styled.div`
    display: flex;
    padding: 8px 15px;
    align-items: center;
    width: 231px;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    & svg {
        margin-right: 8px;
    }
`;

const ButtonWrapper = styled.div`
    border-radius: 40px;
    text-align: center;
    display: flex;
    height: 42px;
`;

const VersionInfo = styled.div`
    margin-top: 12px;
    color: ${colors.NEUE_TYPE_LIGHTER_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
`;

type DropdownItem = {
    platform: Platform;
    label: string;
    icon: IconType;
    installerExtension: string;
};

const dropdownItemsData: DropdownItem[] = [
    {
        platform: 'mac',
        label: 'for MacOS',
        icon: 'OS_MAC',
        installerExtension: 'dmg',
    },
    {
        platform: 'win',
        label: 'for Windows 8+',
        icon: 'OS_WINDOWS',
        installerExtension: 'exe',
    },
    {
        platform: 'linux',
        label: 'for Linux',
        icon: 'OS_LINUX',
        installerExtension: 'AppImage',
    },
];

const getIconForCurrentPlatform = (platform: Platform) => {
    return dropdownItemsData.find(item => platform === item.platform)!.icon;
};

const getInstallerURI = (platform: Platform, version: string) => {
    const extension = dropdownItemsData.find(item => platform === item.platform)!
        .installerExtension;
    return encodeURI(`./web/static/desktop/Trezor-Suite-${version}-${platform}.${extension}`);
};

const Index = () => {
    const version: string = process.env.VERSION ? normalizeVersion(process.env.VERSION) : '';
    const [platform, setPlatform] = useState<Platform>('linux');
    const dropdownItems = dropdownItemsData.map(item => ({
        key: 'items',
        options: [
            {
                key: item.platform,
                label: (
                    <DropdownItem>
                        <Icon icon={item.icon} color={colors.NEUE_TYPE_LIGHT_GREY} size={16} />{' '}
                        {item.label}
                    </DropdownItem>
                ),
                noPadding: true,
                callback: () => setPlatform(item.platform),
            },
        ],
    }));

    useEffect(() => {
        const defaultPlatform = getPlatform(window.navigator);
        setPlatform(defaultPlatform);
    }, []);

    return (
        <div>
            <ButtonWrapper>
                <StyledDropdown alignMenu="left" offset={0} items={dropdownItems}>
                    <StyledDropdownButton icon={getIconForCurrentPlatform(platform)}>
                        <Icon icon="ARROW_DOWN" color={colors.NEUE_BG_WHITE} size={15} />
                    </StyledDropdownButton>
                </StyledDropdown>
                <StyledDownloadButton>
                    <Link variant="nostyle" href={getInstallerURI(platform, version)}>
                        Download Desktop
                    </Link>
                </StyledDownloadButton>
            </ButtonWrapper>
            <VersionInfo>Version: {version}</VersionInfo>
        </div>
    );
};

export default Index;
