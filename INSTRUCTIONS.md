You are working with an application named **MetricFlow**.

MetricFlow is a lightweight, plug-and-play event analytics system designed to track user interactions on websites and display insights through a dashboard.

This prompt defines the system context. Do not rebuild or redesign the system unless explicitly asked. Use this information to guide any task given afterward.

---

## System Overview

MetricFlow enables developers to embed a JavaScript tracking script into their websites. This script captures user events and sends them to a backend system for storage, processing, and visualization.

The system follows a hybrid architecture:

* Layered architecture (clear separation of concerns)
* Event-driven architecture (event ingestion and processing)

---

## Architecture Components

### 1. Client Script (JavaScript SDK)

This is a small embeddable script used by external websites.

Responsibilities:

* Initialize with an API key
* Capture events:

  * page_view
  * click
  * custom events
* Automatically collect metadata:

  * URL
  * timestamp
  * user agent
  * element details (for clicks)
* Send events asynchronously to the backend

Behavior:

* Exposes a global function interface:

  * mf('init', apiKey)
  * mf('track', eventName, properties)
* Uses an internal queue before initialization
* Uses sendBeacon or fetch for network requests
* Tracks page load and click events automatically
* Maintains a session identifier in localStorage

---

### 2. Backend (Node.js API)

This is the central system that receives and manages event data.

Responsibilities:

* Accept incoming event data from the client script
* Validate API keys (multi-tenant support)
* Store raw event data
* Expose APIs for dashboard consumption
* Forward or expose data to the analytics engine

Key characteristics:

* REST-based API
* Uses MongoDB for storage
* Handles event ingestion at scale
* May use a queue (e.g., Redis/Kafka) for event processing

---

### 3. Python Analyzer (Analytics Engine)

This module processes raw events into meaningful insights.

Responsibilities:

* Aggregate event data
* Perform session analysis
* Compute metrics such as:

  * total page views
  * click frequency
  * top pages
  * user behavior trends
* Generate simple rule-based insights

Behavior:

* Runs as a background worker or service
* Reads from database or queue
* Writes processed/aggregated data back to storage

---

### 4. Dashboard (Frontend - Next.js)

This is the user-facing interface for viewing analytics.

Responsibilities:

* Fetch processed data from backend
* Display metrics and charts
* Provide insights into user behavior

Features:

* Page views and click metrics
* Top pages and elements
* Time-based trends
* Filtering by event type or date

---

## Data Flow

1. A user interacts with a website
2. The client script captures the event
3. The event is sent to the backend API
4. The backend stores the raw event
5. The analyzer processes the data
6. Processed data is stored
7. The dashboard retrieves and visualizes insights

---

## Key Constraints

* The client script must remain lightweight and non-blocking
* The system supports multiple users via API keys
* Event tracking should be reliable and asynchronous
* The architecture is modular; components should remain decoupled

---

## Instruction for the Tool

Use this context to perform the next task requested by the user.

Do not:

* Redefine the architecture
* Replace technologies
* Simplify the system unless explicitly asked

Do:

* Work within this structure
* Extend or modify specific components when requested
* Maintain consistency with the described design