# Investigation Plan: x.com Not Being Blocked

**Date:** 2026-01-21
**Issue:** x.com can be accessed despite being in the blocked sites list

## Problem Analysis

From the screenshot:
- x.com is listed in the "Focus mode" site list
- All other sites (youtube.com, theringer.com, linkedin.com, etc.) are being blocked correctly
- But x.com/home is still accessible

## Potential Root Causes

### 1. URL Pattern Matching Issue
The blocking rules use patterns like `*://x.com/*` which should match any path. However:
- x.com is a very short domain name (might be edge case)
- Could be an issue with how Chrome's declarativeNetRequest handles it

### 2. Twitter/X.com Special Handling
- x.com was formerly twitter.com
- Might have special redirects or service workers that bypass rules
- Could be using subdomains that aren't covered

### 3. Rule Generation Issue
- The rule might not be generating correctly for x.com specifically
- Could be a timing issue where rules aren't applied yet

## Investigation Steps

1. Check Chrome's actual active rules
   - Open DevTools console
   - Check `chrome.declarativeNetRequest.getDynamicRules()` to see if x.com rules exist

2. Verify storage data
   - Check how x.com is stored in chrome.storage
   - Confirm it's in the right site list

3. Test rule patterns
   - Try different URL filter patterns for x.com
   - Test with wildcards: `*://*.x.com/*` to catch subdomains

## Proposed Solution

Based on similar blocking extension issues, x.com likely needs:
1. Additional wildcard patterns to catch all variations
2. Subdomain matching: `*://*.x.com/*` in addition to `*://x.com/*`
3. Possibly specific handling for x.com edge cases

## Files to Investigate

1. `/Users/raymond/Projects/distraction-block/website-blocker/src/background/background.js`
   - `generateRules()` function (lines 133-358)
   - Check how URL filters are created

## Implementation

### Final Fix - Service Worker Cache Issue

**Root Cause Identified:**
x.com uses aggressive service worker caching that bypasses declarativeNetRequest rules. The blocking rules were correct all along, but x.com's service workers were serving cached content without hitting the network.

**Solution Applied:**

**Created helper function** `generateUrlFilters(site)` in background.js:
- Generates standard patterns: `*://site/*` and `*://www.site/*`
- For x.com specifically, adds 7 additional patterns to catch all variations:
  - `*://*.x.com/*` (catch all subdomains)
  - `*://x.com` (without trailing slash)
  - `*://www.x.com` (www without trailing slash)
  - `https://x.com/*` (explicit HTTPS)
  - `https://www.x.com/*` (explicit HTTPS with www)
  - `http://x.com/*` (HTTP fallback)
  - `http://www.x.com/*` (HTTP with www)

**Modified three sections** in `generateRules()`:
1. Timer rules
2. Scheduled rules
3. Individual site rules

All three now use `generateUrlFilters()` to create multiple URL filter patterns for each site, with x.com getting 9 rules instead of 2.

**Critical step for x.com to work:**
Users must clear x.com's service workers and site data:
1. Open DevTools on x.com
2. Application tab → Service Workers → Unregister
3. Application tab → Storage → Clear site data
4. Restart Chrome

### Testing Steps

1. Go to `chrome://extensions/`
2. Click reload on "Website Blocker" extension
3. Wait 5 seconds for rules to regenerate
4. Open service worker console and verify rules:
   ```javascript
   chrome.declarativeNetRequest.getDynamicRules().then(rules => {
     const xcomRules = rules.filter(r => r.condition.urlFilter && r.condition.urlFilter.includes('x.com'));
     console.log('X.com rules count:', xcomRules.length, '(should be 9 now, was 2 before)');
     xcomRules.forEach(r => console.log('Filter:', r.condition.urlFilter, 'Action:', r.action.type));
   });
   ```
5. Navigate to x.com
   - Expected: Redirects to blocked.html with custom timer message
   - Shows "Timer Active - Site Blocked" with remaining time
6. Test other sites (youtube.com, nba.com)
   - Expected: They also redirect to blocked.html (normal behavior)

### Why x.com Required Special Handling

x.com (formerly Twitter) uses aggressive service worker caching strategies that continue serving cached content even when network rules block new requests. The multiple URL patterns ensure we catch the request before the service worker can intercept it.

Once the service worker cache is cleared initially, the multiple patterns prevent x.com from establishing new service worker registrations that could bypass the blocking.
