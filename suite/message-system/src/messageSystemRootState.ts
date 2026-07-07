import { type SuiteSettingsRootState } from '@suite/settings';
import { type TorRootState } from '@suite/tor';
import { type MessageSystemRootState } from '@suite-common/message-system';

export type MessageSystemSuiteRootState = MessageSystemRootState & SuiteSettingsRootState;

export type MessageSystemSuiteWithTorRootState = MessageSystemSuiteRootState & TorRootState;
