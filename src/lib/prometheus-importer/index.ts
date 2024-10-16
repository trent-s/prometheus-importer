import {ERRORS} from '../../util/errors';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';
import {z, ZodSchema} from 'zod';
import * as dotenv from 'dotenv';

import {ConfigParams, Env} from './types';
import {RangeQueryExecutor} from './helpers/range-query-executor';
import {ParseAndEnrichDataTransformer} from './helpers/data-transformer';

const {ConfigError, InputValidationError} = ERRORS;
const logFile = '/work/pi-log.txt';
import fs = require('fs');

export const PrometheusImporter = (config: ConfigParams): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Validates config.
   */
  const validateConfig = () => {
    const schema = z.object({
      query: z.string(),
      start: z.string(),
      end: z.string(),
      step: z.string(),
      metricLabels: z.array(z.string()),
      metricName: z.string(),
      defaultLabels: z.record(z.any()),
    });

    return validate<z.infer<typeof schema>>(schema, config);
  };

  const validate = <T>(schema: ZodSchema<T>, object: any) => {
    const validationResult = schema.safeParse(object);

    if (!validationResult.success) {
      throw new InputValidationError(validationResult.error.message);
    }

    return validationResult.data;
  };

  /**
   * Validates required env properties.
   */
  const validateEnvProperties = () => {
    if (getEnvVariable('HOST') === '') {
      throw new ConfigError('Environment variable HOST is not defined');
    }
  };

  const getEnvVariable = (key: keyof Env): string => {
    const value = process.env[key];
    if (!value) {
      return '';
    }
    return value;
  };

  /**
   * Execute's strategy description here.
   */
  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    fs.appendFileSync(logFile, 'Entering execute.');
    console.log('---- prometheus-importer -- execute -- starting.');
    if (inputs && inputs[0]) {
      return inputs;
    }
    validateConfig();
    dotenv.config();
    validateEnvProperties();
    const queryExecutor = RangeQueryExecutor();
    const dataTransformer = ParseAndEnrichDataTransformer();
    console.log('---- prometheus-importer -- execute: getting metrics.');
    fs.appendFileSync(logFile, 'query status.');
    fs.appendFileSync(logFile, '  query:' + config.query + '.');
    fs.appendFileSync(logFile, '  step:' + config.step + '.');
    fs.appendFileSync(logFile, '  start:' + config.start + '.');
    fs.appendFileSync(logFile, '  HOST:' + getEnvVariable('HOST'));
    const rawResponse = queryExecutor.getMetricsFor(
      config.query,
      config.step,
      config.start,
      config.end,
      getEnvVariable('HOST'),
      process.env
    );
    console.log('---- prometheus-importer -- execute: good path.');
    return dataTransformer.parseMetrics(
      rawResponse,
      config.metricLabels,
      config.metricName,
      config.defaultLabels
    );
  };

  return {
    metadata,
    execute,
  };
};
