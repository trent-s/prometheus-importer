import {ERRORS} from '../../util/errors';
import {debugLog} from '../../util/debug-log';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';
import {z, ZodSchema} from 'zod';
import * as dotenv from 'dotenv';

import {ConfigParams, Env} from './types';
import {RangeQueryExecutor} from './helpers/range-query-executor';
import {ParseAndEnrichDataTransformer} from './helpers/data-transformer';

const {ConfigError, InputValidationError} = ERRORS;

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
      defaultLabels: z.record(z.string(), z.any()),
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
    debugLog('Entering execute.');
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
    debugLog('query status.');
    debugLog('  query:' + config.query + '.');
    debugLog('  step:' + config.step + '.');
    debugLog('  start:' + config.start + '.');
    debugLog('  HOST:' + getEnvVariable('HOST'));
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
