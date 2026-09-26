import { getTestNowIso } from './testNow';

export function graphqlHeaders(accessToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  const testNow = getTestNowIso();
  if (testNow) {
    headers['X-Test-Now'] = testNow;
  }
  return headers;
}
