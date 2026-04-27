# River Club Flagship UI Polish Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Push the standalone frontend from a polished prototype to a flagship-feeling cyber poker product by upgrading table material richness, reducing dashboard-like panel weight, and strengthening River Club’s unique visual identity.

**Architecture:** Keep the current React/Vite page structure and game flow intact. Focus on high-leverage, presentation-only upgrades inside the existing `frontend/src/pages/*`, `frontend/src/components/table/*`, and `frontend/src/styles/globals.css` paths. Prefer incremental TSX/CSS changes that preserve behavior while increasing visual hierarchy, depth, and brand distinctiveness.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, CSS in `frontend/src/styles/globals.css`

---

## Current Context / Assumptions

- Landing page has already been upgraded into a clearer dual-entry product surface.
- Room page has been elevated into a pre-game lounge / staging area.
- Table page has already received one pass of cinematic lighting and pot/dealer treatment.
- Browser QA indicates the remaining gap is mostly **visual fidelity**, not layout correctness or flow logic.
- The highest remaining issues are:
  1. Table materials still feel UI-flat instead of tactile/luxurious.
  2. Surrounding info panels still feel too “dashboard / control-panel”.
  3. River Club branding is still refined but not signature enough.

---

## Proposed Approach

1. **Finish the table as the emotional hero**
   - Upgrade felt, rail, card-backs, chips, and active-state glow so the center scene feels expensive.
2. **Soften the surrounding boxes**
   - Reduce the sense that the table is surrounded by admin cards; make supporting UI feel docked into the scene.
3. **Inject River Club identity**
   - Use recurring branded motifs (RC back design, gold medallion accents, restrained prestige cues) so the product becomes more memorable.
4. **Re-verify in-browser after each meaningful pass**
   - Build + browser validation remains mandatory before claiming a successful upgrade.

---

## Step-by-Step Plan

### Task 1: Upgrade community-card placeholder system into branded card objects

**Objective:** Eliminate “?” placeholder demo vibes and replace them with branded River Club card-back treatment.

**Files:**
- Modify: `frontend/src/components/table/CommunityBoard.tsx`
- Modify: `frontend/src/styles/globals.css`

**Plan:**
1. Keep the existing `cards.length ? cards : [...]` logic.
2. Replace plain text `?` rendering with a dedicated card-back substructure.
3. Add CSS classes for:
   - premium dark card backs
   - RC medallion mark
   - subtle cyan/violet patterning
   - stronger internal border and specular highlight
4. Preserve real face-card rendering for live card values.

**Verification:**
- Run: `npm run build` from `frontend/`
- Open: `/table`
- Confirm empty board now shows designed card-backs rather than raw question marks.

---

### Task 2: Upgrade table surface materials from flat UI to premium poker scene

**Objective:** Make the center table read as a tactile high-end surface rather than a dark panel with gradients.

**Files:**
- Modify: `frontend/src/components/table/PokerTable.tsx`
- Modify: `frontend/src/styles/globals.css`

**Plan:**
1. Keep the current centerpiece structure (`pot cluster`, `dealer marker`, `CommunityBoard`).
2. Add richer material layers in CSS for:
   - felt texture / subtle grain
   - deeper rail / oval edge separation
   - more realistic spotlight falloff
   - richer chip presence
3. If needed, add one lightweight decorative wrapper element in `PokerTable.tsx` for texture/overlay purposes.
4. Keep all added elements presentational only (`aria-hidden` where decorative).

**Verification:**
- Run: `npm run build`
- Browser QA on `/table`
- Specifically check whether the table now feels more like a physical premium surface.

---

### Task 3: Reduce dashboard-like weight of supporting panels

**Objective:** Make top summary cards, hero panel, and action panel feel more embedded and less like generic boxes.

**Files:**
- Modify: `frontend/src/pages/table/TablePage.tsx` (only if structural micro-adjustments help)
- Modify: `frontend/src/styles/globals.css`

**Plan:**
1. Keep current information architecture intact.
2. Reduce boxiness via CSS:
   - lighter borders on secondary panels
   - more overlay / glass treatment
   - less equal visual weight across all modules
   - stronger visual dominance for the main table
3. If necessary, slightly reduce title and strip emphasis so the center table wins more attention.
4. Avoid changing control semantics or button behavior.

**Verification:**
- Run: `npm run build`
- Browser QA on `/table`
- Confirm the page reads less like a dashboard and more like a game scene with support UI.

---

### Task 4: Add River Club signature cues across the table experience

**Objective:** Move from “clean cyber UI” to a more memorable branded poker product.

**Files:**
- Modify: `frontend/src/styles/globals.css`
- Possibly modify: `frontend/src/components/table/PokerTable.tsx`
- Possibly modify: `frontend/src/pages/room/RoomPage.tsx`

**Plan:**
1. Reuse brand motifs already emerging in the card-back system:
   - RC medallion language
   - restrained gold prestige accents
   - cyan/violet cyber lighting kept elegant, not loud
2. Add one or two consistent signature touches only; avoid clutter.
3. If room page needs one final pass, bring the same branded cues into the center waiting-table / seat-halo system.
4. Avoid adding random futuristic ornaments that conflict with the current restrained-luxury direction.

**Verification:**
- Run: `npm run build`
- Browser QA on `/room` and `/table`
- Check whether both pages now feel like they belong to one distinct River Club brand.

---

### Task 5: Final verification pass before claiming “flagship candidate”

**Objective:** Validate the whole polish pass with fresh evidence.

**Files:**
- No code changes required unless QA reveals a gap.

**Plan:**
1. Build fresh:
   - `npm run build`
2. Browser-verify:
   - `http://127.0.0.1:3000/`
   - `http://127.0.0.1:3000/room`
   - `http://127.0.0.1:3000/table`
3. Use browser vision on `/table` for an external visual read.
4. Only claim success if:
   - build passes
   - pages load
   - center table reads as premium hero
   - visual hierarchy is coherent
   - branded card-backs / materials are visible

**Verification evidence to capture:**
- successful build output
- browser snapshots
- concise visual QA conclusion

---

## Files Likely to Change

- `frontend/src/components/table/CommunityBoard.tsx`
- `frontend/src/components/table/PokerTable.tsx`
- `frontend/src/pages/table/TablePage.tsx`
- `frontend/src/pages/room/RoomPage.tsx`
- `frontend/src/styles/globals.css`

---

## Tests / Validation

Primary verification command:

```bash
cd /tmp/hermes-gh/holdem-club-next/frontend
npm run build
```

Browser validation targets:
- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/room`
- `http://127.0.0.1:3000/table`

Validation criteria:
- No TypeScript/Vite build failures
- Table page loads with updated visual treatment
- Room and Table maintain current flow semantics
- Empty states feel branded, not placeholder-like
- The table is the dominant emotional focal point

---

## Risks / Tradeoffs / Open Questions

### Risks
- Over-styling could introduce clutter and undo the current restrained-luxury direction.
- Too many decorative layers may hurt readability or mobile responsiveness.
- Heavy CSS layering could create visual regressions across breakpoints if not rechecked.

### Tradeoffs
- Preserving existing structure reduces risk but limits how cinematic the scene can become.
- CSS-first upgrades are fast and safe, but they may not fully match a bespoke illustrated/rendered hero scene.

### Open Questions
- Whether to stop at a refined flagship UI or go further into custom visual assets for the table scene.
- Whether the next stage should introduce bespoke SVG brand elements for the poker surface itself.

---

## Recommended Execution Mode

Use this as the controller plan, then execute task-by-task. For each task:
1. implement small targeted change
2. build
3. inspect in browser
4. only then move to the next task

If delegating, use subagent-driven-development with one focused task per pass and keep review centered on:
- material richness
- reduced boxiness
- stronger River Club identity
