import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { WIKI_HOW_TO_RUN_URL } from '@trezor/urls';
import { Button, Dropdown, Icon, colors, variables, Link } from '@trezor/components';
import { IconType } from '@trezor/components/src/support/types';
import Translation from '../Translation';
import { Platform, getPlatform } from '../../utils/navigator';
import { versionUtils } from '@trezor/utils';

export const TREZOR_SIGNING_KEY_URL = 'https://trezor.io/security/satoshilabs-2021-signing-key.asc';

const StyledDropdown = styled(Dropdown)`
    height: 100%;
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
        height: 100%;
        padding: 9px 15px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
`;

const StyledDownloadLink = styled(Link)`
    height: 100%;
`;

const DropdownItem = styled.div`
    display: flex;
    padding: 8px 15px;
    align-items: center;
    width: 220px;
    color: ${colors.TYPE_DARK_GREY};
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
    display: flex;
    flex-direction: column;
    margin-top: 12px;
    color: ${colors.TYPE_LIGHTER_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    min-height: 32px;
`;

const Item = styled.div`
    display: flex;
    & + & {
        margin-left: 8px;
    }
`;

const StyledLink = styled(Link)`
    color: ${colors.TYPE_LIGHTER_GREY};
    text-decoration: underline;
    font-weight: 400;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;
`;

type DropdownItem = {
    platform: Platform;
    label: React.ReactNode;
    icon: IconType;
    installerExtension: string;
};

const dropdownItemsData: DropdownItem[] = [
    {
        platform: 'mac-x64',
        label: <Translation id="TR_SUITE_WEB_LANDING_MACOS_LABEL" />,
        icon: 'OS_MAC',
        installerExtension: 'dmg',
    },
    {
        platform: 'mac-arm64',
        label: <Translation id="TR_SUITE_WEB_LANDING_MACOS_ARM64_LABEL" />,
        icon: 'OS_MAC',
        installerExtension: 'dmg',
    },
    {
        platform: 'win-x64',
        label: <Translation id="TR_SUITE_WEB_LANDING_WINDOWS_LABEL" />,
        icon: 'OS_WINDOWS',
        installerExtension: 'exe',
    },
    {
        platform: 'linux-x86_64',
        label: <Translation id="TR_SUITE_WEB_LANDING_LINUX_LABEL" />,
        icon: 'OS_LINUX',
        installerExtension: 'AppImage',
    },
    {
        platform: 'linux-arm64',
        label: <Translation id="TR_SUITE_WEB_LANDING_LINUX_ARM64_LABEL" />,
        icon: 'OS_LINUX_ARM64',
        installerExtension: 'AppImage',
    },
];

const getIconForCurrentPlatform = (platform: Platform) =>
    dropdownItemsData.find(item => platform === item.platform)!.icon;

interface GetURIProps {
    platform: Platform;
    version: string;
    pathToApp: string;
}
const getInstallerURI = ({ platform, version, pathToApp }: GetURIProps) => {
    const extension = dropdownItemsData.find(
        item => platform === item.platform,
    )!.installerExtension;
    return encodeURI(
        `${pathToApp}/static/desktop/Trezor-Suite-${version}-${platform}.${extension}`,
    );
};

const getInstallerSignatureURI = (props: GetURIProps) => {
    const installerURI = getInstallerURI(props);
    return encodeURI(`${installerURI}.asc`);
};

const Index = ({ pathToApp }: { pathToApp: string }) => {
    const version: string = process.env.VERSION
        ? versionUtils.normalizeVersion(process.env.VERSION)
        : '';
    const [platform, setPlatform] = useState<Platform | null>(null);
    const dropdownItems = [
        {
            key: 'items',
            options: dropdownItemsData.map(item => ({
                key: item.platform,
                label: (
                    <DropdownItem>
                        <Icon icon={item.icon} color={colors.TYPE_LIGHT_GREY} size={16} />{' '}
                        {item.label}
                    </DropdownItem>
                ),
                noPadding: true,
                callback: () => setPlatform(item.platform),
            })),
        },
    ];

    useEffect(() => {
        const defaultPlatform = getPlatform(window.navigator);
        setPlatform(defaultPlatform);
    }, []);

    return (
        <div>
            <ButtonWrapper>
                {platform && (
                    <>
                        <StyledDropdown alignMenu="left" offset={0} items={dropdownItems}>
                            <StyledDropdownButton icon={getIconForCurrentPlatform(platform)}>
                                <Icon icon="ARROW_DOWN" color={colors.BG_WHITE} size={15} />
                            </StyledDropdownButton>
                        </StyledDropdown>
                        <StyledDownloadLink
                            variant="nostyle"
                            href={getInstallerURI({ platform, version, pathToApp })}
                        >
                            <StyledDownloadButton>
                                <Translation id="TR_SUITE_WEB_LANDING_DOWNLOAD_DESKTOP" />
                            </StyledDownloadButton>
                        </StyledDownloadLink>
                    </>
                )}
            </ButtonWrapper>
            <VersionInfo>
                {platform && (
                    <>
                        <Row>
                            <Item>
                                <Translation
                                    id="TR_SUITE_WEB_LANDING_VERSION"
                                    values={{ version }}
                                />
                            </Item>
                            <Item>
                                <StyledLink
                                    variant="nostyle"
                                    href={getInstallerSignatureURI({
                                        platform,
                                        version,
                                        pathToApp,
                                    })}
                                >
                                    <Translation id="TR_SUITE_WEB_LANDING_SIGNATURE" />
                                </StyledLink>
                            </Item>
                            <Item>
                                <StyledLink variant="nostyle" href={TREZOR_SIGNING_KEY_URL}>
                                    <Translation id="TR_SUITE_WEB_LANDING_SIGNING_KEY" />
                                </StyledLink>
                            </Item>
                        </Row>
                        {platform.includes('linux') && (
                            <Row>
                                <Item>
                                    <StyledLink variant="nostyle" href={WIKI_HOW_TO_RUN_URL}>
                                        <Translation id="TR_SUITE_WEB_LANDING_HOW_TO_VERIFY" />
                                    </StyledLink>
                                </Item>
                            </Row>
                        )}
                    </>
                )}
            </VersionInfo>
        </div>
    );
};

export default Index;
