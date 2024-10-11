import {ERRORS} from '../../../util/errors';
import {QueryExecutor} from '../interfaces';
import fetch from 'node-fetch-commonjs';
import {AuthCredentials} from '../types';
import {AuthenticationProvider} from './auth-provider';

const {APIRequestError} = ERRORS;

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

    fs.appendFileSync('prom-import.txt', 'In RangeQueryExecutor.');
    fs.appendFileSync('prom-import.txt', '  requestbody:' + requestbody + '.');
    fs.appendFileSync('prom-import.txt', '  authHeaders:' + authHeaders + '.');
    fs.appendFileSync('prom-import.txt', '  connectionUrl:' + connectionUrl);

    const response = await fetch(connectionUrl, {
      method: 'POST',
      headers: {...contentHeaders, ...authHeaders},
      body: new URLSearchParams(requestbody).toString(),
    });
    if (response.ok) {
      const jsonResponse = (await response.json()) as Record<string, any>;
      if (jsonResponse.status !== 'success') {
        console.log('Error fetching metrics. Status not success.');
        fs.appendFileSync('prom-import.txt', 'Status not success.');
        throw new APIRequestError(
          `Error while fetching metrics from url ${connectionUrl}. Status not success.`
        );
      }
      console.log('validresponse=' + jsonResponse);
      fs.appendFileSync('prom-import.txt', 'validresponse=' + jsonResponse);
      return jsonResponse;
    } else {
      console.log('Error fetching metrics. Response not OK.');
      fs.appendFileSync('prom-import.txt', 'Error fetching, response not ok.');
      throw new APIRequestError(
        `Error while fetching metrics from url ${connectionUrl}. Response not ok.`
      );
    }
  };

  return {
    getMetricsFor,
  };
};
