# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: Ninguno — plataforma web (sin motor de juego)
- **Language**: JavaScript (módulos ES), tipado con JSDoc y verificado con `tsc --checkJs`
- **Version Control**: Git with trunk-based development
- **Build System**: Ninguno — los módulos ES se sirven tal cual.
  Solo comprobación de tipos: `npx tsc --checkJs --noEmit`
- **Asset Pipeline**: Archivos estáticos referenciados por identificador desde un
  manifiesto de banco de imágenes, nunca por ruta desde el código del instrumento

> **Note**: This project uses **no game engine**. The Godot / Unity / Unreal
> specialist agents do not apply. Code routes to the generic programmer agents
> instead — see the Engine Specialists section of
> `.claude/docs/technical-preferences.md`. The `accessibility-specialist` is the
> lead specialist for the input adaptation layer, not a secondary reviewer.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

@docs/engine-reference/web/VERSION.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
