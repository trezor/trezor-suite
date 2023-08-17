import styled from 'styled-components';

import { getChangelogUrl } from '@suite-common/suite-utils';
import { Button, variables } from '@trezor/components';

import { Translation, TrezorLink } from 'src/components/suite';
import { AcquiredDevice } from 'src/types/suite/index';

const Wrapper = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    max-height: 360px;
    min-width: 305px;
    overflow: auto;
`;

const Group = styled.div`
    margin-bottom: 20px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 24px;
`;

const ChangesUl = styled.ul`
    margin-left: 16px;

    & > li {
        margin: 4px 0;
    }
`;

interface FirmwareChangelogProps {
    changelog: string[];
    device: AcquiredDevice;
    notes?: string;
    versionString: string;
}

export const FirmwareChangelog = ({
    changelog,
    device,
    notes,
    versionString,
}: FirmwareChangelogProps) => {
    const changelogUrl = getChangelogUrl(device);

    return (
        <Wrapper>
            <Group key={versionString}>
                <Heading>
                    <Translation id="TR_VERSION" values={{ version: versionString }} />
                    <TrezorLink size="small" variant="nostyle" href={notes || changelogUrl}>
                        <Button variant="tertiary" icon="EXTERNAL_LINK" iconAlignment="right">
                            <Translation id="TR_VIEW_ALL" />
                        </Button>
                    </TrezorLink>
                </Heading>
                <ChangesUl>
                    {/* render individual changes for a given version */}
                    {changelog.map(
                        change =>
                            // return only if change is not an empty array
                            change && <li key={change}>{change}</li>,
                    )}
                </ChangesUl>
            </Group>
        </Wrapper>
    );
};
