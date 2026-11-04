# FLOAT — UI/UX AND DESIGN SYSTEM SPECIFICATION

**Design system version:** 1.0

PERSONAL CASH-FLOW PLANNING
Proposed design direction

Know where your money is going.
A quiet, confident interface that makes future money decisions easier to understand.
Light theme

Warm, open, reassuring
Dark theme

Quiet, deep, comfortable

The personality: Calm, optimistic, intelligent, personal and grounded.

The difference from Ledgerly: Ledgerly uses structured tables and dense operational information. Float uses breathing room, timelines, clear numbers and visual explanations. It should be approachable without becoming childish or overly playful.
## 1. Brand identity and design philosophy
Float should feel like a personal financial planning space.

It should communicate:
- Financial clarity.
- Calm and confidence.
- Control without judgement.
- Simplicity.
- Forward planning.
- Personalisation.
Its visual identity should be warmer and softer than Ledgerly's. Users should feel comfortable spending time inside the application, reviewing their money and exploring possible financial decisions.
Logo direction
Create a simple wordmark using lowercase float.

The logo mark could incorporate an abstract flowing line or overlapping shapes that represent money moving across time.

Avoid:
- Currency symbols as the main logo.
- Piggy banks.
- Coins.
- Upward financial arrows.
- Generic cryptocurrency imagery.
The logo should work in full wordmark, symbol-only, favicon and PWA icon formats.

## 2. Colour system
The palette should be based on muted teal, sage green, warm ivory and charcoal.
Primary palette

Deep teal
#235E62

Muted teal
#477F77

Sage
#75A99A

Soft sage
#DCEBE5

Warm ivory
#F8F7F1

Charcoal
#292F2D

Light theme tokens
| Token | Hex | Usage |
|---|---|---|
| Brand primary | #235E62 | Primary actions and key emphasis |
| Brand secondary | #477F77 | Secondary actions and charts |
| Brand hover | #194A4E | Hover states |
| Brand soft | #DCEBE5 | Selected surfaces |
| Brand subtle | #EFF5F1 | Soft background accents |
| App background | #F8F7F1 | Main background |
| Surface | #FFFFFF | Cards and panels |
| Surface secondary | #F0F2EC | Grouped sections |
| Surface tertiary | #E8ECE5 | Hover and muted surfaces |
| Text primary | #292F2D | Primary text |
| Text secondary | #59645F | Supporting text |
| Text muted | #87918B | Metadata |
| Border | #E2E6DF | Default borders |
| Border strong | #CBD5CC | Emphasised borders |
| Accent | #D6AA69 | Select highlights and restrained accents |

Dark theme tokens
Dark mode should feel like a warm, deep teal environment, not a black dashboard.
| Token | Hex | Usage |
|---|---|---|
| Brand primary | #9BCFC1 | Main brand emphasis |
| Brand secondary | #78B5A6 | Secondary emphasis |
| Brand hover | #B5DED2 | Hover states |
| Brand soft | #29413B | Selected surfaces |
| App background | #152321 | Main background |
| Surface | #1D2D29 | Main cards and panels |
| Surface secondary | #253731 | Secondary surfaces |
| Surface tertiary | #2B4039 | Hover surfaces |
| Text primary | #EAF3EF | Main text |
| Text secondary | #B9CCC5 | Supporting text |
| Text muted | #899F96 | Metadata |
| Border | #30433C | Default borders |
| Border strong | #435A50 | Emphasised borders |
| Accent | #D8B77C | Limited highlights |

Financial status colours
Float must not make ordinary spending feel like a failure. Its colours should inform rather than judge.
| State | Light background | Light text | Meaning |
|---|---|---|---|
| Available / positive | #E7F2EC | #326B51 | Money available |
| Income received | #E9F3EC | #326B51 | Money received |
| Planned expense | #EDF1F4 | #566A78 | Upcoming commitment |
| Caution | #FFF3DF | #895C1A | Potential cash-flow pressure |
| Shortfall | #F9EAE7 | #A64D43 | Projected shortfall |
| Informational | #EAF1F5 | #416A83 | Additional context |

Create equivalent darker backgrounds and lighter readable text for dark mode.

Rules:
- A completed expense is not an error.
- A projected shortfall deserves attention, not a judgemental message.
- Never use colour alone to communicate availability.
- Positive figures should not automatically be coloured green in every context.
- Clearly differentiate confirmed income from estimated income.

## 3. Typography
Primary typeface: DM Sans
Use DM Sans for:
- Page headings.
- Body text.
- Navigation.
- Forms.
- Buttons.
- Labels.
- Cards.
- Descriptions.
- General UI.
It should feel approachable, clean and contemporary.
Secondary typeface: DM Mono
Use DM Mono for:
- Financial calculations.
- Account references.
- Transaction identifiers.
- Dates in technical contexts.
- Small financial metadata.
Main money figures should use DM Sans with tabular numerals enabled, not monospace.
Font weights
| Weight | Usage |
|---|---|
| 400 | Body text |
| 500 | Labels and navigation |
| 600 | Section headings and buttons |
| 700 | Primary headings and important figures |

Type scale
| Element | Desktop | Mobile |
|---|---|---|
| Display / hero | 40px | 32px |
| Page heading | 28px | 24px |
| Section heading | 20px | 18px |
| Subheading | 16px | 16px |
| Body | 14px | 14px |
| Supporting text | 13px | 13px |
| Small label | 12px | 12px |

Financial number styling
Financial figures are the most important typography in Float.

The available balance should be visually prominent, but not excessively oversized.

Use:
- Tabular numerals.
- Consistent currency placement.
- Readable thousands separators.
- Clear negative-value formatting.
- Consistent decimal precision.
- Flexible layouts for different currency lengths.
Support currencies with different symbol and formatting conventions.

## 4. Layout and navigation
Float should use a simpler application shell than Ledgerly.

Its interface is more personal, and users should not feel as though they are operating a corporate accounting system.
Desktop navigation
Use a left sidebar approximately 224px wide, with a top application bar.

Sidebar sections:

Overview

- Home.

Money
- Accounts.
- Transactions.
- Income.
- Expenses.
- Commitments.
Planning
- Cash-flow timeline.
- Forecast.
- What-if simulator.
Personal
- Categories.
- Settings.
The navigation should have a restrained active state using soft sage and teal.

The top bar should include:
- Page context.
- Global search where appropriate.
- Quick-add action.
- Notifications.
- Theme selector.
- Profile menu.
Mobile navigation
Use a fixed bottom navigation with five destinations:
1. Home.
2. Timeline.
3. Add.
4. Accounts.
5. More.
The central Add action should provide a quick entry point for income, expenses, transfers and commitments.

The More section should contain:
- Forecast.
- Simulator.
- Categories.
- Settings.
Support mobile safe areas and keyboard visibility.

## 5. Component design language
Float's components should be softer than Ledgerly's while still maintaining consistency and precision.
Buttons
Recommended styles:
- Primary teal.
- Secondary soft sage.
- Outline.
- Ghost.
- Destructive.
- Icon-only.
- Loading and disabled.
Desktop height: 40–44px.

Mobile height: 44–48px for important actions.

Example button labels:
- Add income.
- Add expense.
- Reserve money.
- View forecast.
- Simulate purchase.
- Edit commitment.
Inputs
Inputs should feel approachable and easy to use.

Requirements:
- 8–10px radius.
- Clear labels.
- Gentle border contrast.
- Visible focus states.
- Inline validation.
- Mobile-friendly numeric keyboards.
Specialised inputs:
- Currency amount field.
- Date picker.
- Recurrence selector.
- Account selector.
- Category selector.
- Income frequency.
- Confidence or certainty selector.
Important: The currency input must handle large values, decimals, different currency symbols and local number formats correctly. Avoid floating-point precision errors in the underlying financial calculations.
Cards
Use:
- White or dark-theme surface backgrounds.
- Soft borders.
- 14–16px radius.
- Minimal shadows.
- Comfortable internal spacing.
Float can use slightly more generous whitespace than Ledgerly.

Avoid wrapping every piece of information in a separate card.
Pills and status labels
Use compact labels for:
- Confirmed income.
- Expected income.
- Estimated income.
- Paid expense.
- Upcoming expense.
- Reserved.
- Overdue.
- Forecasted.
Use clear wording alongside semantic colours.
Financial metric panels
Large financial figures should have:
- A clear label.
- A prominent amount.
- Supporting context.
- A visual indicator where relevant.
Do not use dramatic colour changes for small fluctuations.
Modals and bottom sheets
Desktop:
- Centred dialogs for focused data entry.
- Right-side panels for account and transaction details.
Mobile:
- Bottom sheets for simple actions.
- Full-screen flows for more involved tasks.
- Large, readable currency entry fields.

## 6. Core screen designs
The following screens should define Float's user experience.
### 6.1 Marketing landing page
The landing page should establish Float's central promise: helping people understand what money is actually available to them and how future decisions affect their finances.

Suggested hero headline:

"Feel good about where your money is going."

Alternative:

"See what you can spend. Plan for what's next."

Supporting copy:

"Float brings your income, expenses and upcoming commitments together, so you can make everyday money decisions with more confidence."

Hero actions:
- Get started.
- See how Float works.
Visual direction:
- Warm ivory background.
- Deep teal headings.
- Sage accents.
- A realistic product preview showing a cash-flow timeline.
- Subtle flowing-line motif.
- No generic stock photos of people holding money.
Landing page sections:
1. Hero.
2. Product interface preview.
3. Available versus reserved money.
4. Cash-flow forecasting.
5. What-if planning.
6. Accounts and income.
7. Privacy and security.
8. Final CTA.
9. Footer.
The landing page should feel like a modern consumer financial product, not a bank website.
### 6.2 Authentication and onboarding
Create:
- Sign-up.
- Login.
- Password recovery.
- Email verification.
- First-time onboarding.
Onboarding should collect only information necessary to personalise the initial experience.

Suggested flow:
1. Welcome to Float.
2. Choose primary currency.
3. Add an initial account and starting balance.
4. Add an income source.
5. Add upcoming commitments.
6. View the initial financial overview.
Let users skip optional steps.

Do not require them to enter all their financial information before they can explore the product.

Be particularly clear about how financial information will be stored and used.
### 6.3 Home dashboard
The home dashboard is the most important screen in Float.

Its primary question should be:

"How much of my money can I actually spend?"

Recommended hierarchy:
A. Header
- Personal greeting.
- Current date.
- Account/currency context.
- Quick-add action.
B. Safe-to-Spend panel
This is Float's signature visual component.

Show:
- Safe-to-Spend amount.
- Date or period this estimate covers.
- Total account balance.
- Reserved commitments.
- Explanation of how the estimate was calculated.
The panel should be visually prominent but restrained.

Example:

Available to spend

₦245,000

Based on your current balance, recorded commitments and expected income.

Show supporting figures beneath:
- Total money: ₦500,000.
- Reserved: ₦200,000.
- Other planned commitments: ₦55,000.
The values should only be examples in design previews. Production figures must come from the calculation engine.

Provide a link to inspect the calculation.
C. Cash-flow snapshot
Show a simple visual timeline of money coming in and going out over the next 30 days.

Users should be able to switch between:
- 7 days.
- 14 days.
- 30 days.
- 60 days.
- 90 days.
Make clear when projected figures depend on uncertain income.
D. Upcoming commitments
Show the next few:
- Bills.
- Subscriptions.
- Debt repayments.
- Reserved expenses.
- Planned purchases.
Each entry should display:
- Description.
- Amount.
- Date.
- Payment status.
E. Upcoming income
Show:
- Expected date.
- Amount.
- Source.
- Confidence status.
Distinguish confirmed payments from estimates.
F. Recent activity
A compact timeline showing recent income, expenses and account transfers.
G. Financial insight
Display one or two meaningful observations.

For example:

"Your projected balance may fall below your preferred minimum before your next expected payment."

Every insight must be supported by actual calculations and offer a route to inspect the relevant data.
### 6.4 Accounts page
Users should be able to create and manage multiple accounts.

Display:
- Account name.
- Account type.
- Currency.
- Current balance.
- Recent activity.
Account detail page:
- Current balance.
- Account metadata.
- Transaction history.
- Incoming funds.
- Outgoing funds.
- Transfers.
- Account-specific settings.
Do not visually imply that an account is bank-connected unless a real banking integration exists.

Manual accounts and imported accounts should have clearly distinguishable connection states.
### 6.5 Transactions page
A clear chronological financial activity view.

Include:
- Search.
- Date filter.
- Account filter.
- Category filter.
- Income/expense filter.
- Amount filter.
- Transaction detail.
Desktop can use a clean table.

Mobile should use stacked transaction cards.

Each transaction should communicate:
- Description.
- Amount.
- Date.
- Account.
- Category.
- Transaction type.
Allow:
- Add transaction.
- Edit transaction.
- Delete transaction.
- Add notes.
- Assign categories.
- Search transactions.
Transfers between accounts must not incorrectly inflate total income or total expenses.
### 6.6 Income and expenses
Create separate but visually consistent management sections.

Income management should support:
- Recurring income.
- Irregular income.
- One-time payments.
- Estimated income.
- Confirmed income.
- Received income.
Expense management should support:
- Recurring expenses.
- One-off expenses.
- Variable expenses.
- Planned purchases.
- Subscriptions.
- Bills.
- Commitments.
The design should make payment status and recurrence easy to understand.
### 6.7 Commitments page
A commitment is money the user has decided to reserve for a future obligation or goal.

Examples:
- Rent.
- School fees.
- Electricity.
- A planned purchase.
- Travel expenses.
Display:
- Commitment name.
- Target amount.
- Reserved amount.
- Remaining amount.
- Due date.
- Priority.
- Account or funding source.
- Status.
Users should understand the difference between:
- Money physically held in an account.
- Money allocated to a commitment.
- Money already paid.
Do not accidentally subtract a reserved amount twice when forecasting.
### 6.8 Cash-flow timeline
This is the second major signature feature.

Use an elegant chronological interface showing how the user's projected financial position changes over time.

Include:
- Starting balances.
- Expected income.
- Expenses.
- Transfers.
- Reserved commitments.
- Projected balances.
Provide period filters and the ability to inspect individual days.

Users should be able to select an item and open its details.

The timeline should clearly distinguish:
- Actual historical transactions.
- Confirmed future transactions.
- Estimated future events.
- Simulated scenarios.
A projected balance must never look like an actual bank balance.
### 6.9 Forecast page
Use a clear visual forecast with:
- Projected balance.
- Future commitments.
- Expected income.
- Potential low-balance dates.
- Uncertain income.
- Cash-flow trends.
The forecast should explain its assumptions.

Allow users to inspect which events contribute to a projected balance on any given day.

Provide an explanation panel, not just a chart.
### 6.10 What-if simulator
This deserves a distinctive and engaging interface.

The user should be able to simulate decisions without modifying their actual financial records.

The simulator should have:
- A proposed decision or event.
- Amount input.
- Expected date.
- Optional recurrence.
- Scenario comparison.
- Resulting projected balance.
- Potential shortfall warnings.
Example scenarios:
- Buying an item.
- Delaying a payment.
- Receiving additional income.
- Receiving income later than expected.
- Increasing a savings commitment.
Use a split design:

Current plan versus Simulated plan.

Show how the proposed change affects:
- Available money.
- Minimum projected balance.
- Future commitments.
- Cash-flow pressure.
Give users the option to save a scenario or discard it.

Saved scenarios must remain separate from confirmed financial records.

## 7. Float's signature visual language
Float should use a small number of distinctive elements consistently.
### 7.1 The Safe-to-Spend component
This should be recognisable as Float's key component.

Use:
- A soft sage background in light mode.
- A deep teal surface in dark mode.
- A clear amount.
- A small explanatory label.
- A link to view the calculation.
Avoid:
- Huge glowing circles.
- Animated money counters.
- Heavy gradients.
- Overly decorative illustrations.
### 7.2 The cash-flow river
Use a smooth chronological line or area visualisation that helps people understand how their projected money position moves through time.

Visual distinctions:
- Solid line for actual historical balances.
- Distinct solid or lightly patterned segments for confirmed future activity.
- Dashed or translucent segments for uncertain projections.
Include:
- Clear dates.
- Hover or tap details.
- Accessible descriptions.
- A simple legend.
Do not let the visualisation obscure actual amounts.
### 7.3 Reserved money indicators
Use small progress indicators for commitments.

For example:
- Target: ₦200,000.
- Reserved: ₦120,000.
- Remaining: ₦80,000.
Show progress without creating a sense of guilt when commitments are incomplete.
### 7.4 Financial insight cards
Insights should look personal and useful.

Use an understated icon, one clear sentence and an action to inspect details.

Do not make every insight a dramatic warning banner.

## 8. Charts and data visualisation
Float should use fewer charts than a traditional analytics dashboard.

Each chart must answer a specific question.

Suggested visualisations:
- Projected balance over time: line or area chart.
- Income versus expenses: grouped bar chart.
- Spending categories: simple horizontal bars.
- Commitment progress: progress indicator.
- Account balances: compact comparison.
Use the teal and sage colour system.

Use red only for actual projected shortfalls or problems requiring attention.

Chart requirements:
- Responsive sizing.
- Readable axes.
- Useful tooltips.
- Clear date ranges.
- Accessible text alternatives.
- Currency formatting.
- Distinction between actual, confirmed and estimated data.
The interface should remain useful if the user disables charts or uses assistive technology.

## 9. Micro-interactions and motion
Use calm, reassuring interactions.

Recommended duration: 150–250ms for common interactions.

Examples:
- Smooth appearance of quick-add sheets.
- Gentle tab transitions.
- Subtle progress changes.
- Clear confirmation when an expense is recorded.
- Soft transitions between forecast periods.
- Animated chart updates when a scenario changes.
Avoid:
- Aggressive bouncing.
- Constant animated backgrounds.
- Floating money illustrations.
- Excessive celebratory effects.
- Animations that delay financial data entry.
Support reduced-motion preferences.

## 10. Responsive and PWA design
Float must be a responsive web application and installable PWA, not a React Native application.

The website must work on mobile browsers without installation.
Mobile home screen
The mobile dashboard should prioritise:
1. Safe-to-Spend.
2. Upcoming commitments.
3. Cash-flow snapshot.
4. Next expected income.
5. Recent transactions.
The user should not need to scroll through several dashboard sections to understand their current financial position.
PWA requirements
- Web app manifest.
- Application icons.
- Standalone display mode.
- Service worker.
- App-shell caching.
- Installation flow where supported.
- Offline fallback.
- Responsive navigation.
- Safe-area support.
Offline financial experience
Offline support must preserve data integrity.

Allow appropriate operations such as:
- Viewing recently cached account information.
- Viewing cached transactions.
- Drafting a new transaction.
- Preparing changes that can be synchronised later.
Clearly label cached information as potentially outdated.

Show pending operations and synchronisation status.

Never claim a financial record has been saved to the server until the server confirms it.

Financial data should be cached selectively. Avoid unnecessary persistent storage of sensitive information, provide a clear sign-out data policy, and remove sensitive caches where appropriate.

## 11. Accessibility and usability
Target WCAG 2.2 AA.

Requirements:
- Keyboard accessibility.
- Screen-reader-friendly forms.
- Semantic navigation.
- Clear focus states.
- Accessible charts.
- Reduced-motion support.
- Adequate colour contrast.
- Touch-friendly mobile controls.
- Readable numeric content.
- Clear validation messages.
For financial entry, minimise the number of steps needed to record an income or expense.

## 12. Design system implementation
Create reusable components and centralised design tokens.

Foundation:
- Light palette.
- Dark palette.
- Typography.
- Spacing.
- Border radius.
- Borders.
- Shadows.
- Responsive breakpoints.
- Chart tokens.
Reusable components:
- Buttons.
- Inputs.
- Currency input.
- Account selector.
- Category selector.
- Date picker.
- Recurrence selector.
- Transaction card.
- Transaction list.
- Metric panel.
- Safe-to-Spend panel.
- Commitment progress.
- Timeline item.
- Forecast chart.
- Insight card.
- Dialog.
- Bottom sheet.
- Drawer.
- Toast.
- Navigation.
Use shadcn/ui or an equivalent system, but customise it thoroughly to match Float.

Use Lucide icons consistently.

Build a small internal design-system showcase displaying all major components in both themes.

## 13. Design exclusions
Do not use:
- Generic purple SaaS styling.
- Cryptocurrency imagery.
- Piggy-bank illustrations.
- Excessive gradients.
- Rainbow financial charts.
- Oversized dashboard cards.
- Overly dense accounting tables.
- Aggressive financial warning colours.
- Guilt-driven financial messaging.
- Unnecessary gamification.
- Unmodified dashboard templates.
Float should never feel like a financial punishment or surveillance tool.

It should feel like a helpful space for making informed financial decisions.

## 14. Definition of design done
Float's design is complete when:
1. Its identity is recognisably different from Ledgerly.
2. The teal, sage and warm ivory palette is consistently applied.
3. Both themes are fully designed.
4. Safe-to-Spend is the clearest visual element on the home dashboard.
5. Actual, confirmed, estimated and simulated financial information are distinguishable.
6. The cash-flow timeline is intuitive.
7. The what-if simulator is easy to understand.
8. Currency amounts are consistently formatted.
9. Mobile-first layouts work without horizontal overflow.
10. Financial data entry is simple and touch-friendly.
11. Empty, loading, error and offline states are fully designed.
12. Charts have accessible alternatives.
13. The PWA installation experience is designed.
14. The marketing site and application feel like one product.
15. The design communicates financial confidence without being judgemental.
Final design direction:

Float is a calm, personal cash-flow planning experience. Its identity is built around muted teal, soft sage, warm ivory, DM Sans typography, clear financial figures, chronological cash-flow visualisations and a signature Safe-to-Spend component.

It should make users feel informed about their money today and prepared for what comes next.

Float's final design decisions
Float
v1.0 locked

| Element | Final decision |
|---|---|
| Brand personality | Calm, personal, intelligent |
| Primary colour | Muted deep teal #235E62 |
| Secondary colour | Sage #75A99A |
| Light background | Warm ivory #F8F7F1 |
| Dark background | Deep teal-charcoal #152321 |
| Primary font | DM Sans |
| Secondary font | DM Mono |
| Component style | Soft, spacious, approachable |
| Desktop layout | Sidebar + top bar |
| Mobile layout | Bottom navigation |
| Interface density | Balanced |
| Themes | Light and dark |
| Signature visual | Safe-to-Spend + cash-flow river |
