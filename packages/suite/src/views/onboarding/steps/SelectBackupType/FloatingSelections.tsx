import {
    useElevation,
    Divider,
    CollapsibleBox,
    Column,
    Banner,
    variables,
    Text,
} from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    spacings,
    spacingsPx,
    zIndices,
} from '@trezor/theme';
import { CSSProperties, forwardRef, useRef } from 'react';
import { Translation, TrezorLink } from 'src/components/suite';
import { LegacyOptions } from './LegacyOptions';
import { isShamirBackupType } from './SelectBackupType';
import { BackupType } from '../../../../reducers/onboarding/onboardingReducer';
import styled from 'styled-components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';
import { ShamirOptions } from './ShamirOptions';

const OptionGroupHeading = styled.div`
    display: flex;
    flex-direction: row;

    gap: ${spacingsPx.md};
    align-items: center;

    padding: ${spacingsPx.xs} 0;
`;

const FloatingSelectionsWrapper = styled.div<{ $elevation: Elevation }>`
    z-index: ${zIndices.modal};
    border-radius: ${borders.radii.sm};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    background: ${mapElevationToBackground};
    overflow-y: auto;
    padding: 0 ${spacingsPx.xxs};
`;

const LegacyOptionsMargin = styled.div`
    margin: 0 ${spacingsPx.sm} ${spacingsPx.md};
`;

const InnerScrollableWrapper = styled.div`
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    padding: ${spacingsPx.sm} ${spacingsPx.md} 0;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: ${spacingsPx.xs} ${spacingsPx.sm};
    }
`;

type FloatingSelectionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    style: CSSProperties;
    defaultType: BackupType;
};

const DividerWrapper = styled.div`
    margin-top: ${spacingsPx.xs};
    margin-bottom: ${spacingsPx.xs};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin-top: ${spacingsPx.xxs};
        margin-bottom: ${spacingsPx.xxs};
    }
`;

const LegacyWarning = () => (
    <Banner variant="info" icon>
        <Column alignItems="start">
            <Text typographyStyle="highlight" variant="info">
                <Translation id="TR_THESE_WONT_ALLOW_YOU_UPGRADE_HEADER" />
            </Text>
            <Translation
                id="TR_THESE_WONT_ALLOW_YOU_UPGRADE"
                values={{
                    a: chunks => (
                        <TrezorLink type="callout" href={HELP_CENTER_MULTI_SHARE_BACKUP_URL}>
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Column>
    </Banner>
);

export const FloatingSelections = forwardRef<HTMLDivElement, FloatingSelectionsProps>(
    ({ selected, onSelect, style, defaultType }, ref) => {
        const { elevation } = useElevation();

        const isShamirBackupDefault = isShamirBackupType(defaultType);
        const legacyOptionsRef = useRef<HTMLDivElement>(null);

        return (
            <FloatingSelectionsWrapper $elevation={elevation} ref={ref} style={style}>
                <InnerScrollableWrapper>
                    <OptionGroupHeading>
                        <Text typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_ONBOARDING_BACKUP_CATEGORY_20_WORD_BACKUPS" />
                        </Text>
                    </OptionGroupHeading>
                    <ShamirOptions
                        defaultType={defaultType}
                        onSelect={onSelect}
                        selected={selected}
                    />
                    <DividerWrapper>
                        <Divider margin={{ top: spacings.zero, bottom: spacings.zero }} />
                    </DividerWrapper>
                </InnerScrollableWrapper>
                {isShamirBackupDefault ? (
                    <div ref={legacyOptionsRef}>
                        <CollapsibleBox
                            margin={{ bottom: spacings.xs }}
                            fillType="none"
                            heading={
                                <Text typographyStyle="hint" variant="tertiary">
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
                            <Column gap={spacings.md} flex="1" alignItems="stretch">
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
                            <Text typographyStyle="hint" variant="tertiary">
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
