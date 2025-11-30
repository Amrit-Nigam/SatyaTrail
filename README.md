# SatyaTrail — News Authenticity & Trail Explorer

A production-quality, frontend-only news platform UI for exploring news articles as tiles, drilling into detailed views, visualizing node-based origin trails, and verifying claims via an agentic ChatGPT-style interface.

## Features

- **Tile-based Feed**: Browse news articles with quick veracity badges
- **Node-based Origin Graphs**: Visualize how stories propagate from origin through amplifiers, debunkers, and commentators
- **Mock Multi-Agent Verification**: ChatGPT-style claim checker with simulated agent responses
- **Source Reputation**: Each source is scored based on historical accuracy
- **Neo-Brutalist Design**: Bold, high-contrast UI with thick borders and offset shadows

## Tech Stack

- **Framework**: Vite + React.js (JavaScript)
- **Styling**: TailwindCSS with Neo-Brutalism theme
- **UI Kit**: Radix UI primitives + Lucide icons
- **State**: Zustand for global stores + URL search params for filters
- **Forms**: react-hook-form + zod
- **Notifications**: sonner
- **Animations**: Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # UI components
│   ├── NBCard.jsx       # Neo-Brutalist card wrapper
│   ├── NBButton.jsx     # Primary/secondary/ghost buttons
│   ├── VerdictBadge.jsx # Veracity verdict pill
│   ├── NewsTile.jsx     # News article tile card
│   ├── FeedFilterBar.jsx# Filter controls for feed
│   ├── TrailGraph.jsx   # Node-based source graph
│   ├── TimelineStrip.jsx# Horizontal timeline
│   ├── ChatPanel.jsx    # ChatGPT-like conversation UI
│   ├── ClaimInputForm.jsx# Verification input form
│   ├── TrailSummaryCard.jsx # Trail summary panel
│   ├── SourceReputationBadge.jsx
│   └── LayoutShell.jsx  # Shared layout with header/footer
├── pages/               # Route components
│   ├── Landing.jsx      # Home page
│   ├── Feed.jsx         # News feed with filters
│   ├── ArticleDetail.jsx# Full article view
│   ├── ArticleTrail.jsx # Trail graph for article
│   ├── ExploreGraph.jsx # Global graph explorer
│   ├── Verify.jsx       # Chat-style claim checker
│   └── About.jsx        # About & methodology
├── lib/
│   ├── services/        # Mock data services
│   │   ├── articlesService.js
│   │   ├── nodesService.js
│   │   ├── sourcesService.js
│   │   └── verificationService.js
│   ├── stores/
│   │   └── useUIStore.js # Zustand store
│   ├── types.js         # JSDoc type definitions
│   └── utils.js         # Utility functions
├── App.jsx              # Main app with routing
├── main.jsx             # Entry point
└── index.css            # Tailwind styles
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page with hero, trending news, and features |
| `/feed` | News feed with filters and grid/list views |
| `/article/:id` | Article detail with sidebar |
| `/article/:id/trail` | Trail graph visualization |
| `/explore/graph` | Global graph explorer (list/network views) |
| `/verify` | ChatGPT-style claim verification |
| `/about` | About & methodology |



