import { Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';

import { BackupType } from '../../../../reducers/onboarding/onboardingReducer';
import { OptionWithContent } from './OptionWithContent';
import { DefaultTag } from './DefaultTag';

type LegacyOptionsProps = {
    selected: BackupType;
    onSelect: (value: BackupType) => void;
    defaultType: BackupType;
};

export const LegacyOptions = ({ defaultType, onSelect, selected }: LegacyOptionsProps) => {
    return (
        <>
            <OptionWithContent
                onSelect={onSelect}
                selected={selected}
                value="12-words"
                tags={
                    defaultType === '12-words' && (
                        <Tooltip
                            content={
                                <Translation id="TR_ONBOARDING_BACKUP_TYPE_12_DEFAULT_TOOLTIP" />
                            }
                        >
                            <DefaultTag />
                        </Tooltip>
                    )
                }
            >
                {defaultType === '12-words' && (
                    <Translation id="TR_ONBOARDING_BACKUP_TYPE_12_WORDS_DEFAULT_NOTE" />
                )}
            </OptionWithContent>

            <OptionWithContent
                onSelect={onSelect}
                selected={selected}
                value="24-words"
                tags={defaultType === '24-words' && <DefaultTag />}
            />
        </>
    );
};
