import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Anchor } from '@suite/router';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { SectionItem } from '@trezor/product-components';

import { useConnectedDateFnsLocale } from '#src/hooks/suite/useConnectedDateFnsLocale';

import { getAutoLockTimes } from './getAutoLockTimes';

type AutoLockOption = {
    label: string;
    value: number;
};

type AutoLockSelectProps = {
    anchorId: string;
    title: ReactNode;
    description: ReactNode;
    // Auto-lock times in seconds.
    presetAutoLockTimes: readonly number[];
    // Auto-lock delay in milliseconds, as the device reports it.
    autoLockDelay: number;
    isDeviceLocked: boolean;
    onChange: (autoLockDelay: number) => void;
    'data-testid': string;
};

export const AutoLockSelect = ({
    anchorId,
    title,
    description,
    presetAutoLockTimes,
    autoLockDelay,
    isDeviceLocked,
    onChange,
    'data-testid': dataTestId,
}: AutoLockSelectProps) => {
    const locale = useConnectedDateFnsLocale();

    const autoLockOptions = {
        label: <Translation id="TR_DEVICE_SETTINGS_AFTER_DELAY" />,
        options: getAutoLockTimes({ presetAutoLockTimes, autoLockDelay }).map(
            (time): AutoLockOption => ({
                label: formatDurationStrict(time, locale),
                value: time,
            }),
        ),
    };

    const handleChange = (option: AutoLockOption) => onChange(option.value * 1000);

    return (
        <Anchor anchorId={anchorId}>
            {({ anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={title}
                    description={description}
                    actions={
                        <SectionItem.Select
                            placeholder=""
                            onChange={handleChange}
                            options={[autoLockOptions]}
                            value={autoLockOptions.options.find(
                                option => autoLockDelay / 1000 === option.value,
                            )}
                            isDisabled={isDeviceLocked}
                            tooltip={{
                                isActive: isDeviceLocked,
                                content: (
                                    <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                                ),
                            }}
                            data-testid={dataTestId}
                        />
                    }
                />
            )}
        </Anchor>
    );
};
