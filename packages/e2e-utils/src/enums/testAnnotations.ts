// Types of annotations that can be defined in the test file
export enum TestAnnotationType {
    TestCase = 'testCase',
    Prerequisites = 'prerequisites',
    Steps = 'steps',
    Category = 'category',
    Priority = 'priority',
    Stream = 'stream',
    OsMatrix = 'osMatrix',
    DeviceModel = 'deviceModel',
}

// Enums for TestAnnotationType
export enum TestCategory {
    Onboarding = 'Onboarding',
    UriLinkHandler = 'URI link handler',
    Wallets = 'Wallets',
    Dashboard = 'Dashboard',
    Security = 'Security',
    SuiteGuide = 'Suite Guide',
    Feedback = 'Feedback',
    Accounts = 'Accounts',
    Coins = 'Coins',
    BTC = 'BTC',
    LTC = 'LTC',
    ETH = 'ETH',
    TradeTab = 'Trade Tab',
    Notifications = 'Notifications',
    Application = 'Application',
    Device = 'Device',
    Settings = 'Settings',
    General = 'General',
    VTC = 'VTC',
    ADA = 'ADA',
    BTV = 'BTV',
    Firmware = 'Firmware',
    CoinJoin = 'CoinJoin',
    Staking = 'Staking',
    Solana = 'Solana',
    Engagement = 'Engagement',
    NotCategorized = 'Not Categorized',
}

export enum TestPriority {
    Critical = 'Critical',
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    AsNecessary = 'As necessary',
}

export const TestPriorityColors: Record<TestPriority, string> = {
    [TestPriority.Critical]: 'RED',
    [TestPriority.High]: 'ORANGE',
    [TestPriority.Medium]: 'YELLOW',
    [TestPriority.Low]: 'GREEN',
    [TestPriority.AsNecessary]: 'GRAY',
};

export enum TestStream {
    Trends = 'Trends',
    Foundation = 'Foundation',
    Engagement = 'Engagement',
    Firmware = 'Firmware',
    NotDefined = 'Not Defined',
}

export enum TestStatus {
    Todo = 'Todo',
    InProgress = 'In Progress',
    DonePass = 'Done PASS',
    DoneFail = 'Done FAIL',
    AutoPass = 'Auto PASS',
    AutoFail = 'Auto FAIL',
    Skipped = 'Skipped',
}

export const TestStatusColors: Record<TestStatus, string> = {
    [TestStatus.Todo]: 'BLUE',
    [TestStatus.InProgress]: 'YELLOW',
    [TestStatus.DonePass]: 'GREEN',
    [TestStatus.DoneFail]: 'RED',
    [TestStatus.AutoPass]: 'GREEN',
    [TestStatus.AutoFail]: 'RED',
    [TestStatus.Skipped]: 'GRAY',
};

export enum TestOsMatrix {
    MacOSArm = 'macOS (ARM)',
    MacOSIntel = 'macOS (Intel)',
    Linux = 'Linux',
    Windows = 'Windows',
    Android = 'Android',
    NotDefined = 'Not Defined',
}

export const TestOsEmoticons: Record<TestOsMatrix, string> = {
    [TestOsMatrix.MacOSArm]: '🍏',
    [TestOsMatrix.MacOSIntel]: '🍎',
    [TestOsMatrix.Linux]: '🐧',
    [TestOsMatrix.Windows]: '🪟',
    [TestOsMatrix.Android]: '🤖',
    [TestOsMatrix.NotDefined]: '❓',
};

export enum DeviceModel {
    T1B1 = 'T1B1',
    T2T1 = 'T2T1',
    T2B1 = 'T2B1',
    T3B1 = 'T3B1',
    T3T1 = 'T3T1',
    T3W1 = 'T3W1',
    Unknown = 'Unknown',
}

// Basic annotation definition
export interface BaseAnnotation {
    name: string;
    key: string;
    valueType: 'TEXT' | 'SINGLE_SELECT';
    valueOptions?: string[];
    optionsColors?: Record<string, string>;
    annotationType?: TestAnnotationType;
    needsFormatting?: boolean;
}

// Individual annotation definitions
export const testCaseAnnotation: BaseAnnotation = {
    name: 'Test Case',
    key: 'testCase',
    annotationType: TestAnnotationType.TestCase,
    valueType: 'TEXT',
};

export const releaseBuildAnnotation: BaseAnnotation = {
    name: 'Release Build',
    key: 'releaseBuild',
    valueType: 'TEXT',
};

export const prerequisitesAnnotation: BaseAnnotation = {
    name: 'Prerequisites',
    key: 'prerequisites',
    annotationType: TestAnnotationType.Prerequisites,
    valueType: 'TEXT',
    needsFormatting: true,
};

export const stepsAnnotation: BaseAnnotation = {
    name: 'Steps',
    key: 'steps',
    annotationType: TestAnnotationType.Steps,
    valueType: 'TEXT',
    needsFormatting: true,
};

export const statusAnnotation: BaseAnnotation = {
    name: 'Status',
    key: 'status',
    valueType: 'SINGLE_SELECT',
    valueOptions: Object.values(TestStatus),
    optionsColors: TestStatusColors,
};

export const streamAnnotation: BaseAnnotation = {
    name: 'Stream',
    key: 'stream',
    annotationType: TestAnnotationType.Stream,
    valueType: 'SINGLE_SELECT',
    valueOptions: Object.values(TestStream),
};

export const testRunAnnotation: BaseAnnotation = {
    name: 'Test Run',
    key: 'testRun',
    valueType: 'TEXT',
};

export const categoryAnnotation: BaseAnnotation = {
    name: 'Category',
    key: 'category',
    annotationType: TestAnnotationType.Category,
    valueType: 'SINGLE_SELECT',
    valueOptions: Object.values(TestCategory),
};

export const priorityAnnotation: BaseAnnotation = {
    name: 'Priority',
    key: 'priority',
    annotationType: TestAnnotationType.Priority,
    valueType: 'SINGLE_SELECT',
    valueOptions: Object.values(TestPriority),
    optionsColors: TestPriorityColors,
};

export const osMatrixAnnotation: BaseAnnotation = {
    name: 'OS Matrix',
    key: 'osMatrix',
    annotationType: TestAnnotationType.OsMatrix,
    valueType: 'SINGLE_SELECT',
    valueOptions: Object.values(TestOsMatrix),
};

export const deviceModelAnnotation: BaseAnnotation = {
    name: 'Device Model',
    key: 'deviceModel',
    annotationType: TestAnnotationType.DeviceModel,
    valueType: 'SINGLE_SELECT',
    valueOptions: Object.values(DeviceModel),
};

export const commentAnnotation: BaseAnnotation = {
    name: 'Comment',
    key: 'comment',
    valueType: 'TEXT',
};

// Defines which annotations are used in the body description in GitHub Issue
export const annotationsForBodyDescription = [prerequisitesAnnotation, stepsAnnotation];

// Defines which annotations are used in the project fields in GitHub Issue
export const annotationsForProjectFields = [
    releaseBuildAnnotation,
    statusAnnotation,
    streamAnnotation,
    osMatrixAnnotation,
    testRunAnnotation,
    priorityAnnotation,
    deviceModelAnnotation,
    commentAnnotation,
];

// Defines which annotations are set for a test case in Playwright
export const annotationsAddedToTest = [
    testCaseAnnotation,
    prerequisitesAnnotation,
    stepsAnnotation,
    streamAnnotation,
    categoryAnnotation,
    priorityAnnotation,
    deviceModelAnnotation,
    osMatrixAnnotation,
];
