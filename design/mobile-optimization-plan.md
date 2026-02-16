# Mobile Optimization Plan

## 1. Landing Page (`landing-override.css`)
**Current Issue:** 
- Forced horizontal layout (`flex-direction: row !important`).
- Overlapping cards specific width (`min-width: 320px`) causes cutoff on small screens.
- "Create" and "Join" sections side-by-side break on < 800px.

**Solution:**
- Add `@media (max-width: 850px)` block.
- **Hero Section:** Switch to `flex-direction: column`.
- **Create Card:** Reduce padding, ensure `width: 90%`.
- **Join Section:** Stack below Create Card, center align.
- **Discovery Grid:** Remove negative margins and rotations. Stack cards vertically or overlapping list with snap-scroll.

## 2. Global Styles (`style.css`)
**Current Issue:**
- `app-header` padding and logo size too large.
- Modal widths (`900px`) and padding (`4rem`) too aggressive for mobile.

**Solution:**
- Reduce `app-header` padding to `1rem 0`.
- Scale down `logo-text` to `1.5rem`.
- Adjust `.profile-modal` to `width: 95%`, `padding: 1.5rem`.

## 3. Host Lobby (`style.css`)
**Current Issue:**
- `padding-top: 10rem` pushes content too far down.
- Absolute positioning of `room-code-container` overlaps content on small screens.

**Solution:**
- Change `room-code-container` to `position: static` (or `relative` with normal flow) on mobile.
- Reduce font sizes for Room Code (`4rem` -> `2.5rem`).
- Stack `pending-sidebar` below `squad-panel`.

## 4. Canvas Game View (`style.css`)
**Current Issue:**
- Fixed `900px` size breaks viewport.
- Palette and Action buttons might cover drawing area or be off-screen.

**Solution:**
- Force `.canvas-wrapper` to `width: 100vw; height: 100vw` (square).
- Adjust `.palette-wrapper` to be smaller, possibly bottom-aligned.
- Move "Management/Leave" buttons to a top-right compact menu.

## 5. Specific Fixes for "Cut off buttons"
- Target `.party-card`.
- Change `min-width: 320px` to `width: 100%; max-width: 340px`.
- Ensure flex container wraps or scrolls cleanly.
