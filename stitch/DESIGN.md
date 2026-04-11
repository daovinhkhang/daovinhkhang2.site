# Design System Specification: Editorial Engineering

## 1. Overview & Creative North Star
**Creative North Star: The Monolithic Architect**

This design system is built to reflect the precision of backend engineering through the lens of high-end editorial design. It rejects the "standard" portfolio template in favor of a "Monolithic" aesthetic—where the UI feels carved out of solid obsidian and glass. By utilizing a "Brutalist Lite" approach, we embrace sharp, 0px radiuses and aggressive typographic scales, but soften the impact with sophisticated tonal layering and glassmorphism. 

The goal is to move away from a "webpage" feel and toward a "digital terminal" experience that feels premium, authoritative, and intentionally sparse.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a pure dark-mode environment. It uses the interaction between deep blacks and varying shades of gray to create a sense of structural depth without relying on decorative elements.

### The "No-Line" Rule
**Traditional 1px solid borders are strictly prohibited for sectioning.** 
Structure must be defined through background shifts. Instead of drawing a line between a header and a body, transition the background from `surface` to `surface-container-low`. This creates a "monolithic block" feel where sections are perceived as physical masses.

### Surface Hierarchy & Nesting
Use the surface-container tiers to create an "inverted" depth model. 
*   **Base:** `surface` (#131313) for the primary background.
*   **Depressed:** `surface-container-lowest` (#0E0E0E) for code blocks or embedded technical logs, creating a sense of "looking into" the machine.
*   **Elevated:** `surface-container-high` (#2A2A2A) for interactive cards or floating modular panels.

### The "Glass & Gradient" Rule
To elevate the "Lite Brutalism," use Glassmorphism for floating navigation elements or overlay modals. Apply a `surface` color at 60% opacity with a `backdrop-blur: 20px`. Main CTAs should utilize a subtle linear gradient from `primary` (#FFFFFF) to `primary-container` (#D4D4D4) at a 135-degree angle to provide a metallic, machined finish.

---

## 3. Typography: Authority in Precision
The typography system pairs the technical precision of `Inter` for body text with the architectural impact of `Space Grotesk` for headlines.

*   **Display (Space Grotesk):** Set with tight letter-spacing (-0.04em) and high contrast. Use `display-lg` (3.5rem) for hero statements to create a "poster-like" impact.
*   **Headline & Title (Space Grotesk):** These act as the structural anchors. They should be bold and uppercase when used as `label-md` to mimic technical documentation headers.
*   **Body (Inter):** Reserved for narrative and technical descriptions. The `body-lg` (1rem) should have a generous line-height (1.6) to ensure the minimalist layout remains readable and airy.
*   **Labels (Space Grotesk):** Used for "code-like" metadata. These are the "high-contrast" markers. Use `primary` text on `surface-container-highest` backgrounds for maximum visibility.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a function of light, not lines.

*   **The Layering Principle:** Stack `surface-container` tiers. A `surface-container-low` section should house `surface-container-highest` cards. This creates a natural "lift" that feels integrated into the UI's architecture.
*   **Ambient Shadows:** For floating elements, use a "Ghost Shadow." 
    *   *Values:* `0px 20px 40px rgba(0, 0, 0, 0.4)`. 
    *   Shadows should never be "gray"; they must be a darker version of the background to simulate the absence of light in a physical space.
*   **The "Ghost Border" Fallback:** If a container requires a boundary (e.g., in high-density data views), use a `1px` stroke of `outline-variant` (#474747) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use for persistent UI elements like sidebars or top-navs. This allows the typography of the page to scroll underneath, creating a sophisticated "depth of field" effect.

---

## 5. Components: Machined Primitives

### Buttons
*   **Primary:** Sharp edges (0px). `on_primary` (#1A1C1C) text on `primary` (#FFFFFF) background. No hover transition on color; instead, use a slight `Y-axis` shift (-2px) to indicate interactivity.
*   **Secondary:** `outline` stroke at 20% opacity. Text in `primary`. 
*   **Tertiary:** Pure text in `label-md` scale, all-caps, with a `->` trailing character.

### Input Fields
*   **Style:** Underline only (2px `outline-variant`). When focused, the underline transitions to `primary` (#FFFFFF). 
*   **Labels:** Use `label-sm` positioned 8px above the input, always in `on_surface_variant` (#C6C6C6).

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Spacing:** Separate list items using 24px of vertical white space. 
*   **Visual Separator:** Use a subtle background hover state (`surface_bright` at 5% opacity) to highlight the active row.

### The "Terminal" Component (Signature)
A custom component for an AI/Backend Engineer: a `surface-container-lowest` box with a 1px `outline-variant` (10% opacity). Use `Roboto Mono` (or `Inter` at `label-sm`) to display JSON-formatted metadata or system logs. This reinforces the technical "Backend" identity.

---

## 6. Do's and Don'ts

### Do
*   **Embrace Negative Space:** If a section feels empty, add more space, not more elements.
*   **Align to a Rigid Grid:** While the layout is asymmetrical, every element must snap to a strict 8px grid to maintain "engineering" precision.
*   **Use Mono-spacing for numbers:** Any data, timestamps, or version numbers should use a mono-spaced font or `font-variant-numeric: tabular-nums`.

### Don't
*   **No Rounded Corners:** Any radius above 0px breaks the "Brutalist Lite" aesthetic. 
*   **No Drop Shadows on Text:** Typography must remain stark and flat against the background.
*   **No High-Contrast Borders:** Never use #FFFFFF or #919191 at 100% opacity for lines; it creates visual noise that distracts from the content.
*   **No Generic Icons:** Avoid "bubbly" or filled icons. Use ultra-thin (1pt or 1.5pt) stroke icons to match the sharp typography.