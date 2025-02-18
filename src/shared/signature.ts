const crypto = require('crypto');

export function generateSignature(
  secret: string,
  method: string,
  uri: string,
  timestamp: number,
  body: object,
) {
  const url = new URL(uri);
  const path = url.pathname + url.search;

  const hmac = crypto.createHmac('SHA256', secret);

  hmac.update(`${method.toUpperCase()}${path}${timestamp}`);
  hmac.update(Buffer.from(JSON.stringify(body)));
  return hmac.digest('hex');
}

export function verifySignature(
  signature: string,
  content: {
    secret: string;
    method: string;
    uri: string;
    timestamp: number;
    body: object;
  },
) {
  try {
    const generatedSignautre = generateSignature(
      content.secret,
      content.method,
      content.uri,
      content.timestamp,
      content.body,
    );
    return generatedSignautre === signature;
  } catch (err) {
    console.log(err);
  }
  return false;
}

export const SIGNATURE_TIMESTEMP_HEADER = 'x-dibsy-timestamp';
export const SIGNATURE_HEADER = 'x-dibsy-signature';
