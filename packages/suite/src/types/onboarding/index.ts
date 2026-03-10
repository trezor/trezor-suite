import { type TranslationKey } from '@suite/intl';
import { type AnyPath, type AnyStepId } from '@suite/onboarding';
import { type DeviceModelInternal, type FirmwareType } from '@trezor/device-utils';
import { type FirmwareVersionString } from '@trezor/device-utils/src/types';

import { type PrerequisiteType } from 'src/utils/suite/prerequisites';

type ModelWithFirmwareVersion = {
    model: DeviceModelInternal;
    minFwVersion: FirmwareVersionString;
};

export type StepCategoryKey = 'device' | 'wallet' | 'pin' | 'coins' | 'final';

export type StepCategory = {
    id: StepCategoryKey;
    steps: Step[];
    labelTranslationId?: TranslationKey;
};

export type Step = {
    id: AnyStepId;
    prerequisites?: (PrerequisiteType | 'device-different')[];
    path?: AnyPath[];
    supportedModels?: (DeviceModelInternal | ModelWithFirmwareVersion)[];
    supportedFirmwareTypes?: FirmwareType[];
};
