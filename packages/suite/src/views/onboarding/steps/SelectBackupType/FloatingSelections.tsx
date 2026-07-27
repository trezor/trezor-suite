import { type CSSProperties, forwardRef, useRef } from 'react';

import styled from 'styled-components';

import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type BackupType } from '@suite-common/suite-types';
import { Banner, CollapsibleBox, Column, Divider, Text, variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { LegacyOptions } from './LegacyOptions';
import { ShamirOptions } from './ShamirOptions';
import { isShamirBackupType } from '../utils';

const OptionGroupHeading = styled.div`
    display: flex;
    flex-direction: row;

    gap: 16px;
    align-items: center;

    padding: 8px 0;
`;

const FloatingSelectionsWrapper = styled.div`
    z-index: ${zIndices.modal};
    border-radius: 12px;
    box-shadow: ${({ theme }) => theme.surfaceShadowModeless};
    background: ${({ theme }) => theme.surfaceFillModeless};
    overflow-y: auto;
    padding: 0 4px;
`;

const LegacyOptionsMargin = styled.div`
    margin: 0 12px 16px;
`;

const InnerScrollableWrapper = styled.div`
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    padding: 12px 16px 0;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 8px 12px;
    }
`;

type FloatingSelectionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    style: CSSProperties;
    defaultType: BackupType;
};

const DividerWrapper = styled.div`
    margin-top: 8px;
    margin-bottom: 8px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin-top: 4px;
        margin-bottom: 4px;
    }
`;

const LegacyWarning = () => (
    <Banner
        intent="info"
        icon
        description={
            <Column alignItems="start">
                <Text typographyStyle="body-md-strong" intent="info">
                    <Translation id="TR_THESE_WONT_ALLOW_YOU_UPGRADE_HEADER" />
                </Text>
                <Translation
                    id="TR_THESE_WONT_ALLOW_YOU_UPGRADE"
                    values={{
                        a: chunks => (
                            <TrezorLink
                                typographyStyle="body-sm-strong"
                                href={HELP_CENTER_MULTI_SHARE_BACKUP_URL}
                            >
                                {chunks}
                            </TrezorLink>
                        ),
                    }}
                />
            </Column>
        }
    />
);

export const FloatingSelections = forwardRef<HTMLDivElement, FloatingSelectionsProps>(
    ({ selected, onSelect, style, defaultType }, ref) => {
        const isShamirBackupDefault = isShamirBackupType(defaultType);
        const legacyOptionsRef = useRef<HTMLDivElement>(null);

        return (
            <FloatingSelectionsWrapper ref={ref} style={style}>
                <InnerScrollableWrapper>
                    <OptionGroupHeading>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_ONBOARDING_BACKUP_CATEGORY_20_WORD_BACKUPS" />
                        </Text>
                    </OptionGroupHeading>
                    <ShamirOptions
                        defaultType={defaultType}
                        onSelect={onSelect}
                        selected={selected}
                    />
                    <DividerWrapper>
                        <Divider margin={{ top: 0, bottom: 0 }} />
                    </DividerWrapper>
                </InnerScrollableWrapper>
                {isShamirBackupDefault ? (
                    <div ref={legacyOptionsRef}>
                        <CollapsibleBox
                            margin={{ bottom: 8 }}
                            fillType="none"
                            heading={
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES_SHORT" />
                                </Text>
                            }
                            paddingType="normal"
                            hasDivider={false}
                            onAnimationComplete={() => {
                                legacyOptionsRef?.current?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest',
                                });
                            }}
                        >
                            <Column gap={16} flex="1">
                                <LegacyWarning />
                                <div>
                                    <LegacyOptions
                                        defaultType={defaultType}
                                        onSelect={onSelect}
                                        selected={selected}
                                    />
                                </div>
                            </Column>
                        </CollapsibleBox>
                    </div>
                ) : (
                    <LegacyOptionsMargin>
                        <OptionGroupHeading>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_ONBOARDING_BACKUP_OLDER_BACKUP_TYPES_SHORT" />
                            </Text>
                        </OptionGroupHeading>
                        <LegacyWarning />
                        <LegacyOptions
                            defaultType={defaultType}
                            onSelect={onSelect}
                            selected={selected}
                        />
                    </LegacyOptionsMargin>
                )}
            </FloatingSelectionsWrapper>
        );
    },
);
