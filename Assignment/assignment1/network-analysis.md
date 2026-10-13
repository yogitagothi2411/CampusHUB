# Browser DevTools — Network Analysis

**Website inspected:** _Fill in the website you actually tested_  
**Date/time of test:** _Fill in_  
**Browser:** _e.g., Chrome version shown in About Chrome_  
**Cache setting:** Disable cache checked in DevTools

> **This report must be completed from a real browser capture.** Request count, transferred/page size, resource timing, and 3xx/4xx responses vary by browser, website, and time. They cannot be reliably filled in without your own Network panel results. Do not submit invented measurements.

## Procedure
1. Open the website you selected.
2. Press `F12` or `Ctrl + Shift + I` to open DevTools.
3. Select the **Network** tab.
4. Tick **Disable cache** while DevTools remains open.
5. Reload the page with `Ctrl + R`.
6. Wait for requests to finish.
7. Read the request count and transferred/resource-size total shown in the Network panel summary bar.
8. Click the **Time** column to identify the slowest resource. Record its name, type, and duration.
9. Scan the **Status** column for any `3xx` or `4xx` codes. If none appear, write “None observed in this capture.”
10. Take a screenshot showing the request list and summary bar, and save it in `docs/` if your instructor allows screenshots.

## Observations — fill from your capture

| Required observation | Your measured result |
|---|---|
| Website URL | _Enter the URL_ |
| Total number of requests | _Enter count from Network summary_ |
| Total transferred / page size | _Enter the exact label and value shown; distinguish transferred from resource size_ |
| Single slowest resource | _Enter resource name/path_ |
| Resource type | _Document / Script / Stylesheet / Image / Fetch-XHR / Font / Other_ |
| Slowest resource duration | _Enter duration from the Time column_ |
| Any 3xx response | _Enter status + resource, or “None observed”_ |
| Any 4xx response | _Enter status + resource, or “None observed”_ |

## Analysis
The Network panel shows the requests the browser makes to load a page and the responses it receives. Each row represents a resource request. The **Status** column reports the HTTP result, while **Type** identifies the kind of resource. The **Time** column shows how long a request took. The summary bar reports the request count and size totals; note whether you are recording transferred bytes or the larger decoded/resource size.

In this capture, the slowest resource was **_replace with measured resource_**, taking **_replace with measured duration_**. A slow resource can delay page completion, although a single long request does not automatically mean the whole website is slow. The observed `3xx`/`4xx` responses were **_replace with measured results_**. A `3xx` status indicates redirection; a `4xx` status indicates a client-side/request issue such as `404 Not Found`. Some websites may legitimately produce these statuses, so inspect the specific request before concluding it is an error.

## Evidence
Attach or save your Network-panel screenshot here: `docs/network-capture.png` (optional file name). Do not create a fake screenshot; use the real capture from your browser.
