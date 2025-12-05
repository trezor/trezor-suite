import { CopyableText, type CopyableTextProps } from './CopyableText';
import { DebugModeView } from './DebugModeView';

export type DebugModeCopyableTextProps = CopyableTextProps;

export const DebugModeCopyableText = (props: DebugModeCopyableTextProps) => (
    <DebugModeView>
        <CopyableText {...props} />
    </DebugModeView>
);
