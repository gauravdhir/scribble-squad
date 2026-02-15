# Technical Design Document: Scribble Squad

**Status:** Updated
**Author:** Gaurav (Principal Frontend Developer)
**Project Standard:** Vanilla JS (ES6+), Small File Religion, Test-First.

---

## 1. System Overview
Scribble Squad is a real-time collaborative drawing application. The architecture prioritizes low-latency synchronization of strokes and cursor positions for up to 8 participants, while ensuring a high-end "Glassmorphic" aesthetic.

---

## 2. Technical Stack
- **Frontend:** Vanilla JavaScript (ES Modules).
- **Communication:** WebSockets (via `Socket.io` or native `WebSocket` API) for real-time bi-directional sync.
- **Rendering:** HTML5 Canvas API with a tiered rendering approach (local buffer + external sync).
- **Styling:** Vanilla CSS (Glassmorphism layout + Neon Glow effects).
- **Testing:** Node.js built-in `node:test` (Unit) and **Playwright** (E2E).

---

## 3. High-Level Architecture
We follow a **Feature-Based Structure**. Every logic block is extracted into small files (< 180 lines) to maintain editor performance and clarity.

### Updated Folder Structure
```text
src/
├── core/                   # Shared system logic
│   ├── socket-service.js   # WebSocket abstraction
│   ├── event-bus.js        # Internal app events
│   └── state-manager.js    # Global immutable-ish state
├── features/
│   ├── identity/           # NEW: Profile & Onboarding
│   │   ├── profile-state.js# Name, avatar, and localStorage
│   │   ├── profile-modal.js# Identity entry UI
│   │   └── randomizer.js   # Silly name generator logic
│   ├── lobby/              # Room creation & Discovery
│   │   ├── lobby-service.js
│   │   └── lobby-renderer.js
│   ├── party/              # Host approval & Player list
│   │   ├── party-state.js
│   │   └── party-renderer.js
│   └── drawing/            # The "Chaos Canvas"
│       ├── canvas-engine.js # Low-level Canvas API ops
│       ├── stroke-sync.js   # Sending/receiving paths
│       ├── palette-ui.js    # Color & tool selection
│       └── cursor-manager.js# Remote player indicators
├── lib/                    # Pure utilities
│   ├── dom.js              # createElement/qs helpers
│   ├── math-utils.js       # Coordinate normalization (1000x1000 scale)
│   └── persistence.js      # localStorage wrappers
└── main.js                 # App bootstrap
```

---

## 4. Feature Designs

### A. User Identity & Persistence (Section 2 PRD)
- **State:** `ProfileState` will hold `displayName` and `avatarSeed`.
- **Persistence:** On initialization, the app checks `localStorage`. If empty, the `ProfileSetupModal` is triggered.
- **Randomizer:** A dedicated utility using two arrays (Adjectives + Animals) to generate 8+ friendly names like "Neon Noodle".

### B. Real-Time Sync & Canvas (Section 3 PRD)
- **Local Optimism:** Strokes are rendered immediately locally.
- **Resolution Independence:** All coordinates are normalized to a 1000x1000 unit system before being sent over WebSockets.
- **Canvas Texture:** The `canvas_texture_asset.png` is applied as a CSS background or a low-opacity pattern overlay on the canvas element.

### C. Party & Button Interaction Machine (Section 4 PRD)
- **Knock Button states:**
  - `IDLE`: Pulse neon.
  - `WAITING`: Text "WAITING...", disabled, opacity 70%.
  - `DENIED`: Return to `IDLE` with a "shake" animation.
  - `APPROVED`: Transition to the Party Lobby.
- **Host Approval:** The `PartyState` handles the `approveRequest` and `denyRequest` logic, validated against the 8-player cap.

---

## 5. Testing Strategy (RULE 12/13/19)
- **Unit Tests:** `node:test` for:
    - `profile-state.js`: Ensuring name validation and persistence work.
    - `randomizer.js`: Verifying name generation diversity.
    - `math-utils.js`: 1000x1000 coordinate normalization.
- **E2E Tests:** Playwright for:
    - Identity Flow: Landing Page -> Modal -> Save -> Identity persistent in Header.
    - Host Flow: Create Squad -> Approve -> Verify Squad Growth.

---

## 6. Definition of Done (Gaurav's Mandate)
- **Tests First:** Failing test file created before implementation.
- **Small Files:** No file exceeds ~180 lines.
- **Mock Fidelity:** Strictly follows Reyansh's latest premium mocks.
- **Coverage:** 90%+ for services, 80%+ for UI components.
