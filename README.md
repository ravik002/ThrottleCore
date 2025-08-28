# ThrottleCore
> Flexible Redis-backed **rate limiting** and **deduplication** middleware for Express.

---

## 📌 Overview
ThrottleCore is a lightweight, high-performance middleware that combines **token bucket rate limiting** with **request deduplication** in a single configurable package.

Features:
- 🔹 **Flexible** — Works out-of-the-box or fully configurable per API.
- 🔹 **Redis-backed** — Supports distributed environments.
- 🔹 **Pluggable** — Use as middleware or integrate core logic into custom flows.

---

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Error Handling](#error-handling)

## Installation

This package is hosted on **GitHub Packages** under a private scope.  
To install, you need a **GitHub Personal Access Token (PAT) with access to this repository**.  

Configure your `.npmrc` like so:

```sh
@ravik002:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```
Then run:

```sh
npm install @ravik002/throttlecore
```

## Configuration
ThrottleCore can be initialized with a configuration object via `throttleCore.configureRateLimiter(config)`.  
Below is the full schema:

```js
{
  redisConfig: {
    url: "redis://localhost:6379" // Required: Redis server connection URL
  },
  
  addRateLimitHeaders: true, // Boolean: add X-RateLimit-* headers in responses
  
  policies: [
    {
      category: "limiter",   // Enum: 'limiter' | 'deduplication'
      windowMs: 5000,        // Time window in milliseconds
      limit: 10,             // Max requests allowed in the window (limiter only)
      identityKeyHeader: "x-api-key" // Optional: Header to uniquely identify the requestor.
                                     // Falls back to IP if missing.
    },
    {
      category: "deduplication",
      windowMs: 10000,       // Time window for detecting duplicate requests
      identityKeyHeader: "x-api-key" // Used to scope duplication per unique requestor
    }
  ]
}
```

## Usage

Below is a simple example of integrating **ThrottleCore** into an Express app.

```js
const express = require('express');
const { configureRateLimiter } = require('throttlecore');

const app = express();


(async () => {
  // Initialize ThrottleCore with desired Configurations
  const { limiter, deduplication } = await configureRateLimiter({
    redisConfig: { url: "redis://localhost:6379" },
    addRateLimitHeaders: true,
    policies: [
      { category: "limiter", limit: 10, windowMs: 60000, identityKeyHeader: "x-api-key" },
      { category: "deduplication", windowMs: 60000, identityKeyHeader: "x-api-key" }
    ]
  });

  // Rate Limiting middleware
  app.get("/api/limiting/check", limiter[0], (req, res) => {
    res.status(204).send('');
  });

  // Deduplication middleware 
  app.post("/api/deduplication/check", deduplication[0], (req, res) => {
    res.status(204).send('');
  })

  // ✅ Highly Recommended: Express error handler
  app.use((err, req, res, next) => {
    if (err.errorcode === "TC_RATE_LIMIT_EXCEEDED") {
      return res.status(429).send(err);
    }

    if (err.errorcode === "TC_DUPLICATE_REQUEST") {
      return res.status(409).send(err);
    }
    
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(3000, () => console.log("Server running on http://localhost:3000"));
  
})();
```

## Error Handling

ThrottleCore throws structured errors that you can catch in your Express error middleware.
Each error has:
- `errorcode`: a machine-readable identifier
- `errormessage`: a human-readable description
- `detailedContext`: an array [] containing detailed information about the error

### Error Codes

| Code                        | Description                        | Suggested HTTP Status |
|-----------------------------|------------------------------------|-------------------------|
| TC_RATE_LIMIT_EXCEEDED      | Request exceeded rate limit        | 429 Too Many Requests   |
| TC_DUPLICATE_REQUEST        | Duplicate request detected         | 409 Conflict            |
| TC_REDIS_CONN_ERR           | Redis connection failed/unreachable| 503 Service Unavailable |
| TC_REDIS_COMMAND_ERR        | Redis command failed               | N/A – Internal error    |
| TC_CONFIG_VALIDATION_FAILED | Config validation failed           | N/A - Init phase error  |

**Note:**  
These are *recommended* status codes. You may choose to map them differently in your app.
