# Integrating the MetricFlow Tracking SDK

Welcome to MetricFlow! This guide will walk you through the process of integrating our lightweight, privacy-conscious analytics script into your website. By adding our SDK, you can start tracking user interactions like page views and clicks with minimal setup.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Initialization](#3-initialization)
4. [How It Works: Automatic Tracking](#4-how-it-works-automatic-tracking)
5. [Advanced: Tracking Custom Events](#5-advanced-tracking-custom-events)
6. [Complete Example](#6-complete-example)
7. [Security & Performance](#7-security--performance)
8. [Using with TypeScript](#8-using-with-typescript)

---

## 1. Prerequisites

Before you begin, you will need one thing from your MetricFlow account dashboard:

- **A Publishable API Key:** This key is unique to your website (or "tenant"). It typically starts with `mf_pub_...`.

This key is designed to be publicly visible in your website's source code. It is secured by being tied to your website's domain, so it cannot be used by other sites.

## 2. Installation

To install the MetricFlow SDK, you only need to add one line of code to your website's HTML.

Place the following `<script>` tag just before the closing `</head>` tag of your HTML pages.

```html
<script async defer src="https://your-metricflow-instance.com/mf.js"></script>
```

> **Note:** Please replace `https://your-metricflow-instance.com/mf.js` with the actual URL provided to you for the SDK script. For local testing, this might be `http://localhost:4000/mf.js`.

## 3. Initialization

Once the script is included, you need to initialize it with your unique Publishable API Key. This tells the SDK which account to send data to.

Add the following JavaScript snippet right after the `<script>` tag you just added, or anywhere before the closing `</body>` tag.

```html
<script>
  window.mf =
    window.mf ||
    function () {
      (window.mf.q = window.mf.q || []).push(arguments);
    };
  mf("init", "YOUR_PUBLISHABLE_API_KEY");
</script>
```

Replace `'YOUR_PUBLISHABLE_API_KEY'` with the actual key from your MetricFlow dashboard.

The `window.mf` function is your gateway to interacting with the SDK. The snippet ensures that you can call `mf()` even before the main SDK script has fully downloaded and executed.

## 4. How It Works: Automatic Tracking

Once initialized, the MetricFlow SDK **automatically** begins tracking key user interactions without any further configuration. This includes:

- **Page Views:** A `page_view` event is sent every time a user lands on a new page or the URL changes in a single-page application (SPA).
- **Clicks:** A `click` event is captured for every user click on the page.

For every event, the SDK automatically enriches the data with valuable context:

- **Session ID:** A unique ID is generated for each user session to group related events.
- **URL & Referrer:** The full page URL and the referring site.
- **User Environment:** Browser (`userAgent`), screen dimensions, and viewport size.
- **Element Details (for clicks):** For every click, we capture the HTML tag (`tagName`), `id`, CSS `classes`, and the precise `x`/`y` coordinates of the click.

## 5. Advanced: Tracking Custom Events

While automatic tracking is powerful, you often need to track specific actions that are unique to your application, such as form submissions, video plays, or milestone achievements. You can do this using the `mf('track', ...)` command.

### Syntax

```javascript
mf("track", "YourEventName", { custom_property: "value" });
```

- **`'YourEventName'`**: A string that describes the event (e.g., `'user_signup'`, `'add_to_cart'`).
- **`{...}` (Optional)**: A JavaScript object containing any additional data you want to associate with the event.

### Example: Tracking a "Newsletter Signup" Button

Imagine you have a newsletter signup button. You can track clicks on it like this:

```html
<button onclick="mf('track', 'newsletter_signup', { source: 'footer' });">
  Sign Up
</button>
```

When a user clicks this button, a custom event named `newsletter_signup` will be sent to MetricFlow, along with the property `{ "source": "footer" }`. This allows you to analyze not just _that_ a signup occurred, but _where_ it came from.

## 6. Complete Example

Here is a complete `index.html` file showing a full integration.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Awesome Website</title>

    <!-- 1. Include the MetricFlow SDK Script -->
    <script async defer src="http://localhost:4000/mf.js"></script>

    <!-- 2. Initialize the SDK with your API Key -->
    <script>
      window.mf =
        window.mf ||
        function () {
          (window.mf.q = window.mf.q || []).push(arguments);
        };
      mf("init", "mf_pub_123456789_abcdefg"); // <-- Replace with your actual key
    </script>
  </head>
  <body>
    <h1>Welcome to My Site!</h1>
    <p>
      This is a paragraph. Clicks and page views are being tracked
      automatically.
    </p>

    <!-- 3. Example of a custom event -->
    <button onclick="mf('track', 'cta_click', { button_text: 'Learn More' });">
      Learn More
    </button>
  </body>
</html>
```

## 7. Security & Performance

- **Performance:** The SDK is designed to be non-blocking. It uses modern browser APIs like `navigator.sendBeacon()` to send data efficiently without impacting your website's performance or user experience.
- **Security:** Your Publishable API Key is safe to use in the browser. Our backend enforces that it can only be used to submit data from the domain(s) you have configured in your MetricFlow settings (`allowedOrigins`).

That's it! You are now set up to track user behavior on your website with MetricFlow.

---

## 8. Using with TypeScript

If you are integrating the MetricFlow SDK into a project using TypeScript (common in frameworks like React, Angular, or Vue), you might encounter a compile-time error like:

`Property 'mf' does not exist on type 'Window & typeof globalThis'.`

or

`Cannot find name 'mf'.`

This happens because TypeScript's strict type system needs to be explicitly told about the global `mf` function that our script adds.

To resolve this, you need to create a type declaration file.

1.  **Create a Declaration File**

    Create a new file named `metricflow.d.ts` (or any name ending in `.d.ts`) in your project's source directory (e.g., `src/`). Your TypeScript configuration should be set up to include it automatically.

2.  **Add Type Definitions**

    Copy and paste the following code into your new `metricflow.d.ts` file:

    ```typescript
    interface MetricFlow {
      (command: 'init', apiKey: string): void;
      (command: 'track', eventName: string, properties?: Record<string, any>): void;
      q?: Array<IArguments>;
    }

    declare global {
      interface Window {
        mf: MetricFlow;
      }
      const mf: MetricFlow;
    }
    ```

This code declares the `mf` function on the `window` object and as a global constant. Once this file is added, TypeScript will understand what `mf` is, and the error will disappear, allowing you to use both `window.mf(...)` and `mf(...)`.
