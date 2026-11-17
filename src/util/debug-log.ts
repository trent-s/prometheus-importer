import * as fs from 'fs';

/**
 * Appends a line to the file named by the PI_LOG_FILE environment variable.
 *
 * Does nothing when PI_LOG_FILE is not set. Logging is best effort: a file
 * that cannot be written to never causes the plugin to fail.
 */
export const debugLog = (message: string): void => {
  const logFile = process.env.PI_LOG_FILE;

  if (!logFile) {
    return;
  }

  try {
    fs.appendFileSync(logFile, message + '\n');
  } catch {
    // Debug logging must not break a run.
  }
};
