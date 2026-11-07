# MarbellaPortal

<p align="center">
  <strong>Property search built around Marbella.</strong>
</p>

<p align="center">
  MarbellaPortal helps people explore Marbella properties, narrow their search,<br/>
  save favourites and make an enquiry. It covers search and filters, property details<br/>
  and photo galleries, favourites, accounts and enquiries in one app.<br/><br/>
</p>

<p align="center">
  <strong>Creator and developer:</strong> <a href="https://github.com/wilek162">William Eklund</a><br/>
  <strong>Project website:</strong> <a href="https://marbellaportal.com">marbellaportal.com</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo-4630EB?style=flat-square" alt="React Native and Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square" alt="Supabase" />
  <img src="https://img.shields.io/badge/Status-Pre--launch-orange?style=flat-square" alt="Pre-launch" />
</p>

---

## Screens

<h3 align="center">Listings</h3>

<p align="center">
  <img src="https://github.com/user-attachments/assets/1ebd8eeb-61d8-48de-84c1-770ddbd0b572" width="38%" alt="Listings, dark" />
  &nbsp;
  <img src="https://github.com/user-attachments/assets/5385a914-0384-4bf5-8f47-99871092b9af" width="38%" alt="Listings, light" />
</p>

<h3 align="center">Filtered results</h3>

<p align="center">
  <img src="https://github.com/user-attachments/assets/35deb59c-4b93-4f2b-b024-74c95dddbb57" width="38%" alt="Filtered results, dark" />
  &nbsp;
<img width="38%" alt="Filtered results, light" src="https://github.com/user-attachments/assets/3e59d59e-ef93-47a4-87a7-cb1d61ab4a59" />
</p>

<h3 align="center">Property details</h3>

<p align="center">
  <img src="https://github.com/user-attachments/assets/63fb1c38-ac56-4b6b-a8c2-29bc6fd4c656" width="38%" alt="Property details, dark" />
  &nbsp;
  <img src="https://github.com/user-attachments/assets/88d26be8-0b37-4308-b3c2-c77f24c0e974" width="38%" alt="Property details, light" />
</p>

<h3 align="center">Enquiry form</h3>

<p align="center">
  <img src="https://github.com/user-attachments/assets/17cc9914-c236-46f9-8879-c7c02549b0f7" width="38%" alt="Enquiry form, dark" />
  &nbsp;
  <img src="https://github.com/user-attachments/assets/48b803df-a573-4fa0-be3c-a652d7679287" width="38%" alt="Enquiry form, light" />
</p>

---

## Product overview

This repository is a showcase of the product and a small, runnable piece of code taken from the private app.

## Why it exists

Looking for a property takes more than a list of results. People change their criteria, compare a few places and come back later to make contact. MarbellaPortal sticks to one market and links browsing to the next real step, which is talking to an agent.

Shared UI components keep typography, themes and controls the same across every screen.

## My role

I created MarbellaPortal and handle both product and development: the experience, the app itself, the sign-in and property data integrations, and the testing and release process.

## Architecture

| Layer | Approach |
| --- | --- |
| App | React Native, Expo, TypeScript and Expo Router |
| Interface | Shared themed components and reusable screen patterns |
| Sign-in and user data | Supabase |
| Property data | Dedicated API on top of Resales |
| Testing | Vitest for logic, Jest Expo for runtime tests |
| Releases | Expo EAS, with separate staging and candidate checks |

## Code sample: enquiry drafts that survive interruptions

**The problem.** An enquiry can stretch across browsing, entering contact details, verifying an email and even an app restart. Losing it is annoying. Restoring it for a different account is a privacy issue. And if a retry gets a new request ID, duplicate prevention gets harder.

**What I did.** The draft is saved with an expiry and keeps its original request ID. Before restoring, the app checks the current identity and verified email ownership. A verified draft stays tied to its account. Storage writes run one at a time, so a slow save can't bring back a draft the user already cancelled.

**Trade-offs.** Drafts expire after 24 hours, which limits how long an abandoned one can be recovered. On the web, the adapter uses tab-scoped session storage, so nothing survives once the browser session ends. Storage errors are reported instead of quietly switching to another storage method.

The request ID is kept for the submission step. This sample doesn't include server-side idempotency and doesn't prove that an enquiry email was delivered.

### Read and run it

- [Draft recovery implementation](src/enquiry-draft-store.ts)
- [Regression tests](src/enquiry-draft-store.test.ts)
- [Standalone native storage boundary](src/large-secure-store.ts)

You need Node.js 22.12 or later:

```sh
npm ci
npm run typecheck
npm test
```

The implementation and test files come unchanged from the private app's staging source at commit `727ddc15f50436795f64eeb4aaf2a1765dfb4e18`. The native storage module is swapped for an adapter that is explicitly marked unsupported. The real app uses Expo SecureStore, and the tests mock that layer. You don't need service credentials, a live account or a native build.

The tests cover restart recovery for guests, verified email ownership, rejecting other identities, account binding, damaged and expired drafts, save and cancel ordering, and browser storage failures. A public CI workflow runs the sample on every push.

## What it shows

- Turning a product requirement into concrete state and recovery behaviour.
- Handling ownership during sign-in changes.
- Dealing with async write order and retries.
- Testing failure cases with controlled storage and time.
- Keeping local regression checks separate from real service and release testing.

## Verification

On 26 October 2026, the standalone sample passed its TypeScript check and all 10 regression tests after a clean install from the lockfile. The private app also passed its required TypeScript check and the matching 10 original draft tests. These are local automated results, not hosted or store-release acceptance.

## Scope

This is a selected code sample, not the full app and not a public release. It covers local draft behaviour. It doesn't establish real sign-in delivery, database ownership policies, enquiry delivery or acceptance on an installed Play build. The full product has more screen, integration and release checks in private repositories.

## Contact and rights

For project enquiries, use the contact options on [my GitHub profile](https://github.com/wilek162).

The app is proprietary, and this repository doesn't grant an open-source licence. Third-party dependencies, property data and imagery stay with their respective owners.
