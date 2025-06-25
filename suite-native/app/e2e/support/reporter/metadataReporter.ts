import * as fs from 'fs';
import * as path from 'path';

type TestEntry = {
  name: string;
  status: string;
  duration: number | null;
  failureMessages: string[];
  metadata: Record<string, unknown>;
};

const METADATA_DIR = path.join(process.cwd(), '.metadata');
function readMetadataForTest(name: string): Record<string, unknown> {
    const safeName = Buffer.from(name).toString('base64');
    const filePath = path.join(METADATA_DIR, `${safeName}.json`);
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');

        return JSON.parse(raw);
    } catch {
        console.warn(`No metadata found for test: ${name}`);
        console.warn(`Expected file at: ${filePath}`);

        return {};
    }
}

class MetadataReporter {
  testResults: TestEntry[] = [];

  onTestResult(test: any, testResult: any) {
    for (const assertion of testResult.testResults) {
      const name = assertion.title;
      const metadata = readMetadataForTest(name);

      this.testResults.push({
        name,
        status: assertion.status,
        duration: assertion.duration,
        failureMessages: assertion.failureMessages,
        metadata,
      });
    }
  }

  onRunComplete(_: any, results: any) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
      },
      tests: this.testResults,
    };

    const outputPath = path.join(__dirname, 'detox-metadata-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    // eslint-disable-next-line no-console
    console.log(`✅ Metadata report written to ${outputPath}`);
  }
}

module.exports = MetadataReporter;
