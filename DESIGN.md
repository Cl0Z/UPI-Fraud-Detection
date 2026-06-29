# Design System Documentation: The Sentinel Aesthetic

## 1. Overview & Creative North Star
### Creative North Star: "The Vigilant Ghost"
This design system moves away from the "noisy" and cluttered nature of traditional fintech interfaces. Instead, it adopts the persona of **The Vigilant Ghost**: an interface that is invisible when everything is safe, but authoritative and undeniable when danger is detected. 

We break the "template" look by rejecting rigid, bordered grids in favor of **Tonal Architecture**. By using intentional asymmetry—such as deep-set hero areas that bleed into the edges and overlapping "frosted" cards—we create a premium, editorial feel that suggests sophisticated intelligence rather than a simple database. High-contrast typography scales (Manrope for impact, Inter for utility) ensure that data isn't just displayed; it is curated.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep nocturnal blues and high-frequency teals, designed to reduce eye strain while projecting an aura of "Bank-Grade" security.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** Traditional 1px solid lines create visual clutter that distracts from the data. Boundaries must be defined solely through background color shifts. 
*   *Example:* A `surface-container-low` section sitting directly on a `surface` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use a "Level-Up" nesting logic:
1.  **Base Layer:** `surface` (#0b1326)
2.  **Sectioning:** `surface-container-low` (#131b2e)
3.  **Primary Interaction Cards:** `surface-container` (#171f33)
4.  **Floating/Active Elements:** `surface-container-high` (#222a3d)

### The "Glass & Gradient" Rule
To achieve a signature feel, floating modals and critical alerts must utilize **Glassmorphism**.
*   **Background:** Use `surface-variant` at 60% opacity.
*   **Effect:** `backdrop-blur: 20px`.
*   **Signature Gradients:** For CTAs and high-trust moments, transition from `primary` (#4cd6ff) to `primary-container` (#00637b) at a 135-degree angle. This adds "soul" and depth that flat hex codes cannot provide.

---

## 3. Typography
We utilize a dual-font system to balance editorial authority with technical precision.

*   **Display & Headlines (Manrope):** Used for "The Hook." Large, airy, and bold. Manrope’s geometric nature feels modern and high-tech.
    *   *Headline-LG (2rem):* For account balances or high-level risk scores.
*   **Titles & Body (Inter):** Used for "The Detail." Inter is chosen for its exceptional legibility at small sizes, crucial for reading transaction IDs and fraud timestamps.
    *   *Body-MD (0.875rem):* The workhorse for all transaction descriptions.
    *   *Label-SM (0.6875rem):* Uppercase with 0.05em letter-spacing for metadata (e.g., "TIMESTAMP," "UPI ID").

The hierarchy conveys brand identity by keeping headlines dramatic and body text highly functional and spacious.

---

## 4. Elevation & Depth
In this system, depth is a functional tool, not a decoration.

### The Layering Principle
Stacking `surface-container` tiers creates a natural lift. A `surface-container-lowest` card placed inside a `surface-container-high` area creates a "recessed" look, perfect for input fields or secondary data points.

### Ambient Shadows
Shadows must feel like natural light, not digital artifacts.
*   **Shadow Color:** Always use a tinted version of `on-surface` (#dae2fd) at 4-8% opacity.
*   **Blur:** Use wide, diffused values (e.g., `box-shadow: 0 20px 40px rgba(218, 226, 253, 0.06)`).

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**:
*   **Token:** `outline-variant` (#434654) at **15% opacity**.
*   **Rule:** 100% opaque, high-contrast borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `on-primary` text, `DEFAULT` (8px) radius.
*   **Secondary:** No background. `Ghost Border` with `primary` text.
*   **Tertiary:** Text-only, using `title-sm` weight for clear hit-zones.

### Status Indicators (Crucial for Fraud Detection)
*   **Safe:** Surface `tertiary-container` with `on-tertiary` text. Use a subtle pulse animation for "Live" monitoring.
*   **Warning/Caution:** Surface `secondary-container` with `on-secondary-container` text.
*   **Danger:** Surface `error-container` (#93000a) with `on-error-container` text.

### Cards & Lists
*   **The Divider Ban:** Never use lines to separate list items. Use the **Spacing Scale** `3` (1rem) to create separation, or alternate background shades (`surface-container-low` vs `surface-container-lowest`).
*   **Fraud Alert Card:** Should use `surface-bright` with a 2px left-accent of `error` to draw the eye without boxing the content.

### Fraud-Specific Components
*   **Risk Meter:** A semi-circular gauge using `surface-variant` as the track and a `tertiary` to `error` gradient for the fill.
*   **Transaction "Deep-Dive" Panel:** A glassmorphic side-sheet that slides in from the right, using `backdrop-blur: 16px` to keep the main feed visible but obscured.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use `16` (5.5rem) or `20` (7rem) spacing at the top of pages to give headlines room to breathe.
*   **Do** use `xl` (1.5rem) rounded corners for main dashboard containers to soften the "tech" feel.
*   **Do** lean into `on-surface-variant` for non-essential text to maintain a clear visual hierarchy.

### Don't
*   **Don't** use pure black (#000000). Always use `surface` (#0b1326) to maintain the sophisticated deep-blue tint.
*   **Don't** use standard "Drop Shadows." Always use the **Ambient Shadow** formula.
*   **Don't** crowd the interface. If a screen feels full, increase the container size or move details to a secondary "Ghost" layer.