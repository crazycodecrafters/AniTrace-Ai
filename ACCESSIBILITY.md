# ♿ AniTrace AI - Accessibility (A11y) & WCAG 2.1 Audit

This document details the complete accessibility architecture, audit results, and verification for **AniTrace AI 2.0**.

---

## 📋 WCAG 2.1 Level AA Compliance Scorecard

| Guideline | Requirement | Status | Implementation Details |
|---|---|:---:|---|
| **1.1 Text Alternatives** | 1.1.1 Non-text Content | ✅ PASS | Every image features explicit `alt` text. Decorative icons use `aria-hidden="true"`. |
| **1.3 Adaptable** | 1.3.1 Info and Relationships | ✅ PASS | Semantic landmark elements (`<header>`, `<main id="main-content">`, `<nav>`, `<section>`). |
| **1.4 Distinguishable** | 1.4.3 Contrast (Minimum) | ✅ PASS | Text elements achieve ≥ 4.5:1 contrast against dark background; UI borders achieve ≥ 3:1. |
| **2.1 Keyboard Accessible** | 2.1.1 Keyboard | ✅ PASS | All actions (search, badges, history, frame step) operable via Keyboard without mouse. |
| **2.1 Keyboard Accessible** | 2.1.2 No Keyboard Trap | ✅ PASS | Dialogs and command palette allow escape via `ESC` key. Focus trap managed cleanly by Radix UI. |
| **2.4 Navigable** | 2.4.1 Bypass Blocks | ✅ PASS | "Skip to main content" link provided at top of page for screen reader and keyboard users. |
| **2.4 Navigable** | 2.4.7 Focus Visible | ✅ PASS | Focus states highlighted using `focus-visible:ring-2 focus-visible:ring-primary`. |
| **3.2 Predictable** | 3.2.1 On Focus | ✅ PASS | Focusing controls does not trigger unexpected form submits or context switches. |
| **4.1 Compatible** | 4.1.2 Name, Role, Value | ✅ PASS | Custom interactive controls provide explicit `role`, `aria-label`, and screen reader labels. |

---

## ⌨️ Keyboard Navigation Map

- **`Tab` / `Shift + Tab`:** Moves sequential focus through navigation links, search tabs, buttons, and filter pills.
- **`Ctrl + K` / `Cmd + K`:** Opens Global Command Palette from anywhere in the application.
- **`ESC`:** Dismisses active modals, Command Palette, History Drawer, and detail views.
- **`Enter` / `Space`:** Triggers buttons, opens Badges modal, expands collapsible filter drawers.
- **`Left` / `Right` Arrow Keys:** Navigates between Radix UI tablist triggers.

---

## 🔊 Screen Reader Verification Matrix

| Component | Assistive Technology Pattern | Verification Result |
|---|---|:---:|
| **BadgesModal** | `<DialogTitle className="sr-only">`, `<DialogDescription className="sr-only">` | ✅ PASS |
| **CommandPalette** | Combobox with live region announcements and explicit placeholder | ✅ PASS |
| **ResultCard** | Video playback controls with `aria-label="Step backward 1 second"`, `aria-label="Play/Pause"` | ✅ PASS |
| **HistoryDrawer** | Sheet modal with labeled export/import actions | ✅ PASS |
| **SearchHeader** | Badges button with dynamic otaku level and streak announcements | ✅ PASS |

---

## 🧪 Automated Testing Verification
Automated accessibility tests are executed in `src/test/a11y.test.tsx` as part of the test suite and CI pipeline.
