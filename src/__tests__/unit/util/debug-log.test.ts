import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {debugLog} from '../../../util/debug-log';

describe('util/debug-log: ', () => {
  const originalLogFile = process.env.PI_LOG_FILE;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-debug-log-'));
  });

  afterEach(() => {
    if (originalLogFile === undefined) {
      delete process.env.PI_LOG_FILE;
    } else {
      process.env.PI_LOG_FILE = originalLogFile;
    }
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  it('does nothing when PI_LOG_FILE is not set.', () => {
    delete process.env.PI_LOG_FILE;

    expect(() => debugLog('hello')).not.toThrow();
    expect(fs.readdirSync(tmpDir)).toEqual([]);
  });

  it('appends one line per call when PI_LOG_FILE is set.', () => {
    const logFile = path.join(tmpDir, 'pi-log.txt');
    process.env.PI_LOG_FILE = logFile;

    debugLog('first');
    debugLog('second');

    expect(fs.readFileSync(logFile, 'utf8')).toEqual('first\nsecond\n');
  });

  it('does not throw when the log file cannot be written.', () => {
    process.env.PI_LOG_FILE = path.join(tmpDir, 'missing-dir', 'pi-log.txt');

    expect(() => debugLog('hello')).not.toThrow();
  });
});
