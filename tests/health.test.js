import assert from 'node:assert/strict';
import test from 'node:test';
import { publicHealthHandler, publicHealthPayload } from '../lib/health.js';

test('publicHealthPayload exposes only liveness fields', () => {
  assert.deepEqual(publicHealthPayload(), {
    status: 'ok',
    service: 'essential-ea-commercial-api'
  });
});

test('publicHealthHandler returns a 200 liveness response', () => {
  let statusCode = null;
  let body = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    }
  };

  publicHealthHandler({}, res);
  assert.equal(statusCode, 200);
  assert.deepEqual(body, publicHealthPayload());
  assert.equal(Object.keys(body).length, 2);
});
