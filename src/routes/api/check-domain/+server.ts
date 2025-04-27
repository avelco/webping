// src/routes/api/check/+server.ts

import { json, error as skError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Basic domain validation (adjust regex as needed for stricter rules)
function isValidDomain(domain: string): boolean {
  // Simple check: not empty, contains at least one dot, no spaces
  // Doesn't validate TLDs or complex rules, but catches basic errors.
  return !!domain && domain.includes('.') && !/\s/.test(domain);
}

// Define a reasonable timeout in milliseconds per attempt
const FETCH_TIMEOUT = 10000; // 10 seconds per attempt
const MAX_RETRIES = 2; // Number of retries (total attempts = 1 + MAX_RETRIES)
const RETRY_DELAY = 1000; // Delay between retries in ms

export const GET: RequestHandler = async ({ url }) => {
  const domain = url.searchParams.get('domain');

  if (!domain) {
    throw skError(400, 'Query parameter "domain" is required');
  }

  if (!isValidDomain(domain)) {
    throw skError(400, `Invalid domain format: "${domain}"`);
  }

  let responseTime: number | null = null;
  let status: 'up' | 'down' | 'error' = 'error';
  let reason: string | null = null;
  let httpStatus: number | null = null;
  let attempts = 0;
  const start = performance.now(); // Start timer before retries

  while (attempts <= MAX_RETRIES) {
    attempts++;
    const attemptStart = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const targetUrl = `https://${domain}`; // Check HTTPS for SSL
      console.log(`Attempt ${attempts}: Checking domain: ${targetUrl}`);

      let res = await fetch(targetUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });

      // Fallback to GET if HEAD is disallowed
      if (res.status === 405) {
        console.log(`Attempt ${attempts}: HEAD failed (405), retrying with GET...`);
        res = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
        });
      }

      // Success path
      responseTime = Math.round(performance.now() - attemptStart);
      httpStatus = res.status;

      if (res.ok) {
        status = 'up';
        reason = `OK (${httpStatus})`;
        clearTimeout(timeoutId); // Clear timeout on success
        break; // Exit retry loop on success
      } else {
        // Non-2xx status means 'down' but reachable
        status = 'down';
        if (httpStatus >= 400 && httpStatus < 500) {
          reason = `Client Error (${httpStatus} ${res.statusText})`;
        } else if (httpStatus >= 500 && httpStatus < 600) {
          reason = `Server Error (${httpStatus} ${res.statusText})`;
        } else {
          reason = `HTTP Error (${httpStatus} ${res.statusText})`;
        }
        // Decide if retryable (e.g., server errors might be temporary)
        if (httpStatus >= 500 && attempts <= MAX_RETRIES) {
          clearTimeout(timeoutId);
          console.log(`Attempt ${attempts}: Retrying due to status ${httpStatus}...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue; // Go to next attempt
        } else {
           clearTimeout(timeoutId); // Clear timeout
           break; // Non-retryable HTTP error or max retries reached
        }
      }
    } catch (err: any) {
      // Handle fetch errors (network, DNS, CORS, timeout, SSL etc.)
      responseTime = Math.round(performance.now() - attemptStart);
      status = 'down';

      // Clear the timeout timer regardless of outcome within this attempt
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        reason = `Timeout after ${FETCH_TIMEOUT}ms (Attempt ${attempts})`;
      } else if (err instanceof TypeError) {
        // TypeErrors often indicate network, DNS, or SSL/TLS issues
        if (err.message.includes('certificate')) {
            reason = `SSL/TLS Certificate Error: ${err.message} (Attempt ${attempts})`;
        } else if (err.message.includes('fetch failed') || err.message.includes('dns') || err.message.includes('ENOTFOUND')) {
            reason = `Network/DNS Error: ${err.message} (Attempt ${attempts})`;
        } else {
             reason = `Network Error: ${err.message} (Attempt ${attempts})`;
        }
      } else {
        reason = `Fetch Error: ${err.message || 'Unknown fetch error'} (Attempt ${attempts})`;
      }
      console.error(`Attempt ${attempts} Error for ${domain}: ${reason}`, err);

      // Retry on timeout or potential network issues, up to MAX_RETRIES
      if ((err.name === 'AbortError' || err instanceof TypeError) && attempts <= MAX_RETRIES) {
          console.log(`Attempt ${attempts}: Retrying after error...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue; // Go to next attempt
      }
      // If error is not retryable or max retries reached, break loop
      break;

    } finally {
      // ensure timeout cleared if loop breaks unexpectedly (though should be handled above)
      // clearTimeout(timeoutId); // Already cleared in success/error paths within try/catch
    }
  } // End of while loop

  const totalDuration = Math.round(performance.now() - start);
  console.log(`Finished check for ${domain} in ${totalDuration}ms after ${attempts} attempts. Status: ${status}, Reason: ${reason}`);

  return json({
    domain,
    status,
    responseTime: status === 'up' ? responseTime : null, // Only report responseTime if check was successful
    httpStatus,
    reason,
    checkedAt: new Date().toISOString(),
    attempts, // Optionally include number of attempts
  });
};
