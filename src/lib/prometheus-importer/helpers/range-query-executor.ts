import {ERRORS} from '../../../util/errors';
import {QueryExecutor} from '../interfaces';
import fetch from 'node-fetch-commonjs';
import {AuthCredentials} from '../types';
import {AuthenticationProvider} from './auth-provider';

const {APIRequestError} = ERRORS;
const logFile = '/work/pi-log.txt';

import fs = require('fs');

export const RangeQueryExecutor = (): QueryExecutor => {
  const getMetricsFor = async (
    query: string,
    step: string,
    start: string,
    end: string,
    host: string,
    authCredentials: AuthCredentials
  ) => {
    const connectionUrl = host + '/api/v1/query_range';

    const contentHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const authProvider = AuthenticationProvider();
    const authHeaders = authProvider.getAuthHeaders(authCredentials);

    const requestbody = {
      query: query,
      start: start,
      end: end,
      step: step,
    };

    console.log('In RangeQueryExecutor:');
    console.log('    requestbody= ' + requestbody);
    console.log('    authHeaders= ' + authHeaders);
    console.log('    connectionUrl= ' + connectionUrl);

    fs.appendFileSync(logFile, 'In RangeQueryExecutor.');
    fs.appendFileSync(logFile, '  requestbody:' + requestbody + '.');
    fs.appendFileSync(logFile, '  authHeaders:' + authHeaders + '.');
    fs.appendFileSync(logFile, '  connectionUrl:' + connectionUrl);

    const response = await fetch(connectionUrl, {
      method: 'POST',
      headers: {...contentHeaders, ...authHeaders},
      body: new URLSearchParams(requestbody).toString(),
    });
    if (response.ok) {
      const jsonResponse = (await response.json()) as Record<string, any>;
      if (jsonResponse.status !== 'success') {
        console.log('Error fetching metrics. Status not success.');
        fs.appendFileSync(logFile, 'Status not success.');
        throw new APIRequestError(
          `Error while fetching metrics from url ${connectionUrl}. Status not success.`
        );
      }
      console.log('validresponse=' + jsonResponse);
      fs.appendFileSync(logFile, 'validresponse=' + jsonResponse);
      return jsonResponse;
    } else {
      console.log('Error fetching metrics. Response not OK.');
      fs.appendFileSync(logFile, 'Error fetching, response not ok.');
      throw new APIRequestError(
        `Error while fetching metrics from url ${connectionUrl}. Response not ok.`
      );
    }
  };

  return {
    getMetricsFor,
  };
};
