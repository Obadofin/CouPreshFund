# CoupreshFund — Product Requirements Document (PRD)

## Product Overview

CouPresh is a student financial empowerment program designed to help Nigerian undergraduate students build financial capital, discipline, and practical readiness while still in school.

The platform enables students to set graduation financial goals, save consistently, develop financial intelligence, and receive mentorship and sponsor support, graduating with not just a certificate but capital, skills, and a clear plan for life after school.

This document authorises the planning, design, and development of a Minimum Viable Product (MVP) for the CouPresh platform, to be executed by the Project 500 team in collaboration with the founder.

## Problem Statement

Most Nigerian undergraduates graduate with little to no savings and no structured financial plan for life after school.

This stems from poor financial planning during the academic period, low financial literacy, limited access to saving tools designed for students, and no clear bridge between the academic phase and financial independence.

Existing financial apps in the market focus solely on saving money; none combine goal-setting, financial education, and structured milestone tracking around a student's specific graduation objective.

## Product Goal

To help students graduate with more than a certificate by giving them the tools, discipline, knowledge, opportunities, and financial foundation required to launch their next chapter.

## User Roles

| User | Role |
|---|---|
| Students | Registers, sets a graduation financial goal, tracks savings, completes financial education modules, earns milestone rewards |
| Parents | Links to a student account to view progress and make contributions toward the student's goal |
| University Admin | Manages the platform, views aggregate user data and analytics, and can trigger or suppress notifications |

## Project Scope

| In Scope | Out of Scope |
|---|---|
| Savings Tracking Board | Launch checklist |
| User registration | NYSC registration |
| Parent registration | Monitoring and user feedback |
| Different Tiers for student | Sponsor matching integration |
| User Onboarding | Use of AI features/chatbots |
| MVP Launch | Full mentorship marketplace |
| UX journey mapping | Commercial partner onboarding portal |

## Feature Requirements

- Responsive landing page
- Secure student registration/login
- Student profile: institution, course, level, graduation year
- Graduation financial goal and purpose
- Weekly/monthly/custom savings plan
- Progress dashboard
- Milestone engine
- Savings streaks and challenges
- Basic financial-learning content
- Notifications/re-engagement
- Basic referral capability
- Admin dashboard
- Analytics/events for validation
- Growth Unlock prototype without live investment activity

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | The system must allow a student to register using an email address or phone number |
| FR-02 | The system must allow a student to set a graduation financial goal, including target amount, graduation year, and post-graduation plan |
| FR-03 | The system must allow a student to log or track savings contributions toward their goal |
| FR-04 | The system must automatically progress a student through milestone tiers based on savings thresholds reached |
| FR-05 | The system shall unlock financial education content progressively as milestones are reached |
| FR-06 | The system shall award points to a student upon completing a lesson or reaching a milestone |
| FR-07 | The system shall send a reminder notification to a student who has not logged savings activity within 14 days |
| FR-08 | The system shall allow a parent or guardian to link to a student's account via a unique invite code |
| FR-09 | The system shall send a re-engagement notification at 21 and 30 days of continued inactivity |
| FR-10 | The system shall allow an admin to manually trigger or suppress a notification campaign |

## Non-Functional Requirements (Quality Requirements)

| ID | Requirement |
|---|---|
| NFR-01 | The platform shall be mobile-responsive and function correctly on low to mid-range Android devices |
| NFR-02 | The platform shall load core pages within 3 seconds on a standard 3G connection |
| NFR-03 | The platform shall encrypt all personally identifiable information (PII) both in transit and at rest |
| NFR-04 | The platform shall be available 99% of the time during the MVP pilot period |
| NFR-05 | The backend API shall be versioned (e.g. `/api/v1/`) to support a future native mobile app without breaking changes |
| NFR-06 | The platform shall comply with the Nigeria Data Protection Act (NDPA) 2023 for all user data collection and storage |
| NFR-07 | Any feature involving actual money movement shall route through a CBN-licensed payment partner; the platform shall not directly hold or transmit funds |

## Dependencies

- A confirmed technology stack (language, framework, database, hosting) must be agreed before backend development starts
- Design assets (wireframes, high-fidelity prototype) must be approved before development begins on any screen
- A CBN-licensed payment service provider must be selected and onboarded before any feature involving real money movement can be built (candidates: Paystack, Flutterwave, Providus Bank)
- A KYC verification provider (e.g. Smile Identity, Mono) is required if BVN/NIN verification is part of the registration flow
- NDPC registration must be completed before any user data collection begins

## Assumptions

- The MVP will track savings that are self-reported by students unless the founder confirms actual payment processing is required for MVP (this decision is still pending and should be confirmed before development starts)
- The founder will provide access to any existing brand assets, domain, and repository ownership within 5 working days of project kickoff
- Beta users (a pilot cohort of students) will be made available for user acceptance testing before launch
- Primary communication with the founder will be via WhatsApp and email, with response turnaround within 48 hours
- The pilot cohort will be Android-majority users, consistent with the general Nigerian undergraduate demographic

## Success Metrics

- Users (student) must be able to register and login successfully
- The student should be able to unlock growth milestone/next tier
- 50% of active users log a savings activity weekly
- 20% of inactive users return after a 14-day reminder

## MVP

### Must-Have Features

- Responsive landing page
- Secure student registration/login
- Student profile: institution, course, level, graduation year
- Graduation financial goal and purpose
- Weekly/monthly/custom savings plan
- Progress dashboard
- Milestone engine
- Savings streaks and challenges
- Basic financial-learning content
- Notifications/re-engagement
- Basic referral capability
- Admin dashboard
- Analytics/events for validation
- Growth Unlock prototype without live investment activity

> **Note:** This list mirrors the Feature Requirements above. For this project, the full feature set defined above *is* the MVP. Scope is controlled through explicit exclusions rather than trimming the list further, see below.

### MVP Exclusions

- Bitcoin/crypto wallet
- Lending/BNPL
- Full investment marketplace
- Native Android/iOS apps
- Complex social network
- AI financial adviser
- International expansion
- Unnecessary blockchain infrastructure

### Acceptance Test

MVP is successful when a student can register, set a graduation goal, select a contribution plan, view progress, complete a learning activity, reach a milestone, and receive an appropriate re-engagement/notification experience.

## Approval

| Role | Name | Date | Signature |
|---|---|---|---|
| Founder | Onofua Precious | 28/09/2026 | Signed |
| Project Manager | Gloria Aigbotsua, Chigozie Kamah, Daniel Obadofin, Toyin Orowole, Emmanuel Abbah | 22/09/2026 | Gloria A, Chigozie K, Daniel O, Toyin O, Emmanuel A |
| Development Team | Group H: Daniel Obadofin, Gloria Aigbotsua, Emmanuel Abbah, Oluwatoyin Orowole, Chigozie Kamah | | |

---
*The PM Tribe — IT Project Management Bootcamp | Project 500, Cohort 1 | Group H*