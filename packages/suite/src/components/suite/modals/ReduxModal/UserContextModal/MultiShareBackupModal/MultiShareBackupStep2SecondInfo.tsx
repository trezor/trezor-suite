import { BackupInstructionsStep } from './BackupInstructionsStep';
import {
    InstructionBaseConfig,
    createSharesInstruction,
    verifyTrezorOwnershipInstruction,
} from './instructionSteps';

export const MultiShareBackupStep2SecondInfo = () => {
    const instructions: InstructionBaseConfig[] = [
        verifyTrezorOwnershipInstruction,
        createSharesInstruction,
    ];

    return instructions.map((content, i) => (
        <BackupInstructionsStep
            key={i}
            stepNumber={i + 1}
            isLast={instructions.length === i + 1}
            {...content}
        />
    ));
};
