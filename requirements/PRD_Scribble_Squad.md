# PRD: Scribble Squad - "Collaborative Chaos"

**Status:** Draft / Approved
**Owner:** Ranjan (Principal Product Owner)
**Target Age:** 8+ (Family Friendly)
**Platform:** Web (Mobile, Tablet, Desktop)

---

## 1. Executive Summary
Scribble Squad is a real-time, social drawing game where a "Squad" of friends works together (or chaotically) on a shared canvas to fulfill a single prompt. It is designed for zero-friction setup—no apps, just a browser and a 4-letter room code.

---

## 2. User Profiles & Onboarding
**[Mock Required: Profile Setup Modal]**

### A. The "Anonymous-First" Identity
*   **Requirement:** Before a user can "Knock" on a party or "Create Squad", they must provide a **Display Name**.
*   **Interaction:** 
    *   Clicking "Knock" or "Create Squad" triggers a glassmorphic prompt.
    *   **Input Field:** Max 12 characters, enforced alphanumeric + spaces.
    *   **Character Randomizer:** A "Shuffle" button to generate a silly name (e.g., "Neon Noodle", "Cosmic Cat") for users who want to skip typing.
*   **Avatar Assignment:** 
    *   Users get an auto-generated avatar based on their name (using a library like DiceBear).
    *   **Interaction:** Tapping the avatar cycles through 5 simple variations/colors.

---

## 3. Core Gameplay Mechanics

### A. The "Chaos Canvas"
**[Mock Required: Game Canvas View]**
*   **Simultaneous Drawing:** Every participant draws on the same canvas at the same time.
*   **Prompt-Based:** Each round has a clear, funny prompt (e.g., "A Dragon eating a Taco").
*   **Real-time Interaction:** Players see each other's cursor (with name/color labels) and strokes instantly.
*   **Toolbox Interaction:**
    *   **Tap-to-Select:** High-contrast buttons for 10 colors. Selected tool shows a glowing "active" state.
    *   **Eraser:** Changes brush mode to "transparent" or "background color".
    *   **Clear All (Host Only):** A "Tornado" icon that clears the canvas for a fresh start.

### B. Judging & Gallery
**[Mock Required: Judging/Result Screen]**
*   **Spectator Reactions:** Non-drawing observers or finished players can "throw" stickers/reactions (hearts, stars) onto the canvas.
*   **Rotation:** One player acts as the "Judge" each round.
*   **Judge Interaction:** 
    *   Three "Medal" buttons (Gold, Silver, Bronze) to assign points.
    *   "Done" button to proceed to the next prompt.

---

## 4. Social & Room Management

### A. Party Creation & Discovery
**[Mock Required: Landing Page - UPDATED]**
*   **Discovery Lobby:** A public list showing "Active Squads".
*   **Interaction (Button States):**
    *   **Normal:** "KNOCK" button with neon pulse.
    *   **Pressed:** Satisfying click sound + visual scale down.
    *   **Pending:** Changes text to "WAITING..." and disables further clicks until Host approves/denies.
    *   **Full:** Changes text to "FULL" and applies grayscale filter + 50% opacity.

### B. Host Lobby (The Party Room)
**[Mock Required: Host Lobby View - UPDATED]**
*   **Access Control Interaction:**
    *   **Approve (Checkmark):** Green button. On click, player moves from sidebar to center grid with a "Pop" animation.
    *   **Deny (X):** Red button. On click, request vanishes from sidebar.
*   **Start Game:** A "LIFT OFF" button that is **Disabled** until at least 2 players are in the squad (excluding host).

---

## 5. Constraints & Safety

### A. Capacity
*   **Max Players:** Strictly capped at **8 participants** per room. 
*   **Logic:** Once 8 slots are occupied in the `participants` array, all "Knock" buttons for that Room ID globally switch to the "FULL" state.

### B. Safety
*   **Profanity Filter:** Mandatory for room names and player usernames.
*   **Host Power:** Host can kick/ban players. 
*   **Interaction:** Tapping a player icon in the lobby reveals a "KICK" menu.

---

## 6. Visual Language (UX Intent)
*   **Aesthetic:** Premium Glassmorphism (translucent panels, soft neon glows, space-themed backgrounds).
*   **Accessibility:** Large touch targets (min 44px), high-contrast text for prompts.
*   **Animations:** Use CSS transitions for all state changes (Hover, Active, Disabled).

---

## 7. Technical Foundations (For Engineering)
*   **Identity Persistence:** Use `localStorage` to remember the user's name/avatar so they don't have to re-enter it on refresh.
*   **Sync Logic:** Low-latency WebSocket communication.
*   **State Management:** Centralized room state handling participant lists, pending requests, and canvas data.
