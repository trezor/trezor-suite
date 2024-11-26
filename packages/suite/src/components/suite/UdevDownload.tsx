import { useState } from 'react';

import styled from 'styled-components';

import { DATA_URL, HELP_CENTER_UDEV_URL } from '@trezor/urls';
import { Button, Select, Spinner } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { LearnMoreButton } from './LearnMoreButton';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Download = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    ${typography.label}

    /* min-height to avoid jumpy behavior in transition loader > select */
    min-height: 40px;
`;

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;

    span {
        margin-left: 12px;
    }
`;

const Manual = styled(Download)`
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
`;

interface Installer {
    label: string;
    value: string;
    preferred?: boolean;
}

export const UdevDownload = () => {
    const transport = useSelector(state => state.suite.transport);

    const installers: Installer[] =
        transport && transport.udev
            ? transport.udev.packages.map(p => ({
                  label: p.name,
                  value: DATA_URL + p.url.substring(1),
                  preferred: p.preferred,
              }))
            : [];
    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);
    const preferredTarget = installers.find(i => i.preferred);
    const target = selectedTarget || preferredTarget || installers[0];

    return (
        <Wrapper>
            <Download>
                {target ? (
                    <>
                        <Select
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            size="small"
                            onChange={setSelectedTarget}
                            options={installers}
                        />
                        <Button href={target.value} margin={{ left: spacings.sm }} minWidth={280}>
                            <Translation id="TR_DOWNLOAD" />
                        </Button>
                    </>
                ) : (
                    <LoaderWrapper>
                        <Spinner size={24} />
                        <Translation id="TR_GATHERING_INFO" />
                    </LoaderWrapper>
                )}
            </Download>
            <Manual>
                <Translation id="TR_UDEV_DOWNLOAD_MANUAL" />
                <LearnMoreButton url={HELP_CENTER_UDEV_URL} />
            </Manual>
        </Wrapper>
    );
};
