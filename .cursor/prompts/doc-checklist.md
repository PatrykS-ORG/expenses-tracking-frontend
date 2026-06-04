Run `git diff HEAD` (or `git diff --cached` if changes are staged) and review every changed file. Then go through the checklist below and flag any documentation that should be updated but wasn't.

## Checklist

### 1. `docs/architecture.md`
- [ ] New page or route added/removed in `App.tsx`?
- [ ] New Zustand store introduced?
- [ ] Data flow changed (new service layer, new API integration)?
- [ ] Auth flow or route guard logic modified?
- [ ] New external service or client added under `src/lib/`?

### 2. `docs/conventions.md`
- [ ] New folder pattern introduced under `src/`?
- [ ] New shared component pattern or hook pattern?
- [ ] "How to add a page/route" or "How to add a store" checklists still accurate?
- [ ] Form handling approach changed?
- [ ] Error handling or loading state pattern changed?

### 3. `docs/tech-stack.md`
- [ ] New dependency added to `package.json`?
- [ ] Major version bump of an existing dependency?
- [ ] Dependency removed?

### 4. `.env.example`
- [ ] New `VITE_*` environment variable used via `import.meta.env`?
- [ ] Existing variable renamed or removed?

### 5. `AGENTS.md`
- [ ] Directory structure section still matches `src/` layout?
- [ ] Commands table still accurate (new scripts in `package.json`)?
- [ ] Key architectural decisions section still current?
- [ ] Planned folders table — has a planned folder now been created?

### 6. `.cursor/rules/react-conventions.mdc`
- [ ] New convention established that the AI should always follow?
- [ ] Existing rule contradicted by the current changes?
- [ ] Folder structure table still accurate?

## Output

For each item that needs attention, state:
- **Which doc** needs updating.
- **What changed** in the codebase (cite the diff).
- **What to add or fix** in the doc.

If everything is up to date, confirm that no documentation changes are needed.
