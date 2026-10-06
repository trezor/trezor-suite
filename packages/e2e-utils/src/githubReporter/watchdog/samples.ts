import {
    DeviceModel,
    TestCategory,
    TestOsMatrix,
    TestPriority,
    TestStatus,
    TestStream,
} from '../../enums/testAnnotations';
import type { AssignedTestStream } from '../types';

interface ReporterWatchdogManualSample {
    testCase: string;
    prerequisites: string[];
    steps: string[];
    category: TestCategory;
    priority: TestPriority;
    stream: AssignedTestStream;
    deviceModel: DeviceModel;
    osMatrix: TestOsMatrix[];
}

export const REPORTER_WATCHDOG_MANUAL_SAMPLES: ReporterWatchdogManualSample[] = [
    {
        testCase: 'Reporter watchdog manual sample A',
        prerequisites: ['none'],
        steps: ['step one'],
        category: TestCategory.General,
        priority: TestPriority.Low,
        stream: TestStream.Growth,
        deviceModel: DeviceModel.T3T1,
        osMatrix: [TestOsMatrix.Linux],
    },
    {
        testCase: 'Reporter watchdog manual sample B',
        prerequisites: ['none'],
        steps: ['step one'],
        category: TestCategory.Wallets,
        priority: TestPriority.High,
        stream: TestStream.Wallet,
        deviceModel: DeviceModel.T2B1,
        osMatrix: [TestOsMatrix.Windows],
    },
    {
        testCase: 'Reporter watchdog manual sample C',
        prerequisites: ['none'],
        steps: ['step one'],
        category: TestCategory.Firmware,
        priority: TestPriority.Critical,
        stream: TestStream.Firmware,
        deviceModel: DeviceModel.T1B1,
        osMatrix: [TestOsMatrix.Android],
    },
];

export const EXPECTED_MANUAL = REPORTER_WATCHDOG_MANUAL_SAMPLES.map(sample => ({
    title: sample.testCase,
    fields: {
        Status: TestStatus.Todo,
        Stream: sample.stream,
        Priority: sample.priority,
        'OS Matrix': sample.osMatrix[0],
        'Device Model': sample.deviceModel,
    },
}));

export const REPORTER_WATCHDOG_NATIVE_MANUAL_SAMPLES: ReporterWatchdogManualSample[] = [
    {
        testCase: 'Reporter watchdog native manual sample A',
        prerequisites: ['none'],
        steps: ['step one'],
        category: TestCategory.Dashboard,
        priority: TestPriority.Medium,
        stream: TestStream.Growth,
        deviceModel: DeviceModel.T2T1,
        osMatrix: [TestOsMatrix.Android],
    },
    {
        testCase: 'Reporter watchdog native manual sample B',
        prerequisites: ['none'],
        steps: ['step one'],
        category: TestCategory.Accounts,
        priority: TestPriority.AsNecessary,
        stream: TestStream.Wallet,
        deviceModel: DeviceModel.T3B1,
        osMatrix: [TestOsMatrix.MacOSArm],
    },
];

export const EXPECTED_NATIVE_MANUAL = REPORTER_WATCHDOG_NATIVE_MANUAL_SAMPLES.map(sample => ({
    title: sample.testCase,
    fields: {
        Status: TestStatus.Todo,
        'Test Run': 'Manual',
        Stream: sample.stream,
        Priority: sample.priority,
        'OS Matrix': sample.osMatrix[0],
        'Device Model': sample.deviceModel,
    },
}));

interface ReporterWatchdogAutomatedSample {
    testCase: string;
    shouldFail: boolean;
}

export const REPORTER_WATCHDOG_AUTOMATED_SAMPLES: ReporterWatchdogAutomatedSample[] = [
    { testCase: 'automated pass', shouldFail: false },
    { testCase: 'automated fail', shouldFail: true },
];
