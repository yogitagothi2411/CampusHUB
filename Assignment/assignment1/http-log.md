# HTTP by Hand — Annotated `curl -i` Log

**API used:** JSONPlaceholder, a public read-only practice JSON API  
**Purpose:** Inspect HTTP status lines, response headers, content types, and JSON bodies.

> **Important:** Network access was unavailable in the preparation environment, so the responses below are response shapes/examples, not a verified live transcript. Run every command in your own terminal and replace the example header values with the exact output you receive. Keep the complete output, including the status line and headers, for submission. Dynamic headers such as `Date`, `Connection`, and caching headers can change.

Run each command separately in PowerShell, Command Prompt, or a terminal with `curl` installed. `curl -i` includes response headers in its output.

## 1. Retrieve one post — expected `200 OK`

**Command**
```bash
curl -i https://jsonplaceholder.typicode.com/posts/1
```

**Example response body**
```json
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}
```

**Annotation:** `200 OK` means the request succeeded. `Content-Type: application/json; charset=utf-8` means the response body is JSON text encoded as UTF-8.

## 2. Retrieve one user — expected `200 OK`

**Command**
```bash
curl -i https://jsonplaceholder.typicode.com/users/1
```

**Example response body**
```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": { "lat": "-37.3159", "lng": "81.1496" }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
}
```

**Annotation:** `200 OK` means the user resource was found. The JSON `Content-Type` tells the client how to parse the response body.

## 3. Retrieve comments for a post — expected `200 OK`

**Command**
```bash
curl -i "https://jsonplaceholder.typicode.com/posts/1/comments"
```

**Example response body (shortened for readability; retain the complete live output in your submitted capture)**
```json
[
  {
    "postId": 1,
    "id": 1,
    "name": "id labore ex et quam laborum",
    "email": "Eliseo@gardner.biz",
    "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos"
  }
]
```

**Annotation:** `200 OK` means the request was processed successfully. The endpoint returns a JSON array of comments associated with post 1. The real response normally contains multiple objects; keep the full output from your run.

## 4. Filter posts by user — expected `200 OK`

**Command**
```bash
curl -i "https://jsonplaceholder.typicode.com/posts?userId=1"
```

**Example response body (shortened for readability; retain the complete live output in your submitted capture)**
```json
[
  {
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit..."
  }
]
```

**Annotation:** `200 OK` means the server successfully processed the query. `?userId=1` is a query parameter used to filter the posts. The live result contains all matching posts; preserve the complete response when you run it.

## 5. Deliberately request a resource that does not exist — expected `404 Not Found`

**Command**
```bash
curl -i https://jsonplaceholder.typicode.com/this-resource-does-not-exist
```

**Example response shape**
```text
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{}
```

**Annotation:** `404 Not Found` means the server could not find a resource matching the requested path. The exact status-line version, headers, and body may differ; copy the actual result from your run.

## What to observe in each response
- **Status line:** protocol version and status code, such as `HTTP/1.1 200 OK`.
- **`Content-Type`:** identifies the media type of the response body. JSON APIs commonly use `application/json; charset=utf-8`.
- **Other headers:** may include `Date`, `Cache-Control`, `Connection`, `Content-Length`, `Server`, or security/caching headers. Their presence and values depend on the server.
- **Response body:** JSON data or an error representation.

## Submission checklist
- [ ] Run all five commands locally.
- [ ] Keep complete, actual `curl -i` outputs, including status lines and headers.
- [ ] Replace shortened/example bodies above with the full output where the task requires the full exchange.
- [ ] Add one sentence after each actual response explaining the status code and `Content-Type`.
- [ ] Ensure request 5 is a real 404 from your run.
