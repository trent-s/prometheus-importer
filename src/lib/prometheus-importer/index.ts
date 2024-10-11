import {ERRORS} from '../../util/errors';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';
import {z, ZodSchema} from 'zod';
import * as dotenv from 'dotenv';

import {ConfigParams, Env} from './types';
import {RangeQueryExecutor} from './helpers/range-query-executor';
import {ParseAndEnrichDataTransformer} from './helpers/data-transformer';

const {ConfigError, InputValidationError} = ERRORS;

const fs = require('fs');

export const PrometheusImporter = (
  globalConfig: ConfigParams
): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Validates global config.
   */
  const validateGlobalConfig = () => {
    const schema = z.object({
      query: z.string(),
      start: z.string(),
      end: z.string(),
      step: z.string(),
      metricLabels: z.array(z.string()),
      metricName: z.string(),
      defaultLabels: z.record(z.any()),
    });

    return validate<z.infer<typeof schema>>(schema, globalConfig);
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
    fs.appendFileSync('prom-import.txt', 'entering execute.');
    console.log('---- prometheus-importer -- execute -- starting.');
    if (inputs && inputs[0]) {
      return inputs;
    }
    validateGlobalConfig();
    dotenv.config();
    validateEnvProperties();
    const queryExecutor = RangeQueryExecutor();
    const dataTransformer = ParseAndEnrichDataTransformer();
    console.log('---- prometheus-importer -- execute: getting metrics.');
    fs.appendFileSync('prom-import.txt', 'query status.');
    fs.appendFileSync('prom-import.txt', '  query:' + globalConfig.query + '.');
    fs.appendFileSync('prom-import.txt', '  step:' + globalConfig.step + '.');
    fs.appendFileSync('prom-import.txt', '  start:' + globalConfig.start + '.');
    fs.appendFileSync('prom-import.txt', '  HOST:' + getEnvVariable('HOST'));
    const rawResponse = queryExecutor.getMetricsFor(
      globalConfig.query,
      globalConfig.step,
      globalConfig.start,
      globalConfig.end,
      getEnvVariable('HOST'),
      process.env
    );
    console.log('---- prometheus-importer -- execute: good path.');
    return dataTransformer.parseMetrics(
      rawResponse,
      globalConfig.metricLabels,
      globalConfig.metricName,
      globalConfig.defaultLabels
    );
  };

  return {
    metadata,
    execute,
  };
};
