import { Link } from 'react-router-dom'
import './PrivacyPolicyPage.css'

const policySections = [
  {
    title: 'Information we collect',
    paragraphs: [
      'When you create an account, we collect your name, email address, password, and, if you choose to provide it, your phone number. We store a protected password hash rather than your readable password. We also process email verification codes to confirm account ownership.',
      'If you use the student features, we collect the education and planning details you enter, such as your institution, course, study level, expected graduation year, savings goal, savings purpose, and planned contribution.',
      'Features you use may also create records of budgets, expenses, self-reported savings contributions, learning progress, challenge progress, points, saved opportunities, and guardian invitation status. Contributions and expenses are self-reported; CouPreshFund does not verify deposits or move money.',
      'The current guardian invitation feature creates and tracks invitation codes only. It does not create guardian accounts, accept invitations, or give guardians access to student data.',
    ],
  },
  {
    title: 'How we use information',
    paragraphs: [
      'We use personal information to create and secure accounts, verify email addresses, provide the app features you request, save your progress and plans, respond to support requests, prevent misuse, and maintain and improve the service.',
      'We do not use your student-entered savings or expense figures to initiate payments or access bank accounts. We do not sell personal information.',
    ],
  },
  {
    title: 'How information is shared',
    paragraphs: [
      'We use service providers to operate the app. Render hosts the application and database. Brevo processes transactional email, including account verification messages. These providers receive information needed to provide their services and process it under their own privacy and security terms.',
      'We may also disclose information when required by law, to protect users or the service, or as part of a business transfer where permitted by applicable law. We do not share student profiles with schools, guardians, scholarship providers, or advertisers through the current app features.',
      'Our service providers may process information in countries other than Nigeria. Where cross-border processing occurs, it is subject to applicable data-protection requirements.',
    ],
  },
  {
    title: 'Browser storage and security',
    paragraphs: [
      'The web app stores an authentication token in your browser’s local storage to keep you signed in and temporarily stores the email awaiting verification in session storage. You can clear these values through your browser, though you may need to sign in again.',
      'We use reasonable safeguards designed to protect personal information. No online service or storage system can be guaranteed completely secure.',
    ],
  },
  {
    title: 'How long we keep information',
    paragraphs: [
      'We keep account and feature information while it is needed to provide the service and for legitimate operational, security, and legal purposes. Verification codes are stored as hashes, expire after 10 minutes, and are cleared after successful verification.',
      'There is currently no in-app account deletion feature. To request access to, correction of, or deletion of your information, contact us using the details below. We may retain information where required or permitted by law.',
    ],
  },
  {
    title: 'Your privacy rights',
    paragraphs: [
      'Depending on applicable law, including the Nigeria Data Protection Act 2023, you may have rights to request access to your personal information, correct it, request deletion or restriction, object to certain processing, or withdraw consent where processing relies on consent.',
      'To make a request or raise a privacy concern, email contact@coupreshfunds.com. We may need to verify your identity before responding. You may also have the right to complain to the Nigeria Data Protection Commission or your local data-protection authority.',
    ],
  },
  {
    title: 'Students under 18',
    paragraphs: [
      'A student under 18 may use CouPreshFund only with verifiable consent from a parent or legal guardian. Contact contact@coupreshfunds.com before a student under 18 provides personal information so that consent can be arranged.',
      'The current app does not include an in-app parental-consent verification flow. Guardian invitation codes are not parental consent and do not give guardians access to student accounts. If an under-18 student has registered without the required consent, the parent or guardian should contact us so we can restrict the account and address the information.',
    ],
  },
  {
    title: 'Changes and contact',
    paragraphs: [
      'We may update this policy as the service or applicable requirements change. The latest version and its effective date will be posted on this page.',
      'CouPreshFund is the operator of this service. For privacy questions or requests, contact contact@coupreshfunds.com.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <header className="privacy-header">
        <Link aria-label="CouPreshFund home" className="privacy-brand" to="/">
          <span aria-hidden="true" className="privacy-brand-mark">C</span>
          <span>CouPresh<span>Fund</span></span>
        </Link>
        <Link className="privacy-home-link" to="/">Back to home</Link>
      </header>

      <article className="privacy-content">
        <p className="privacy-eyebrow">COUPRESHFUND · PRIVACY</p>
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Effective date: November 14, 2026</p>
        <p className="privacy-intro">
          This policy explains how CouPreshFund collects, uses, stores, and shares
          information when you use our website and student services.
        </p>

        {policySections.map((section, index) => (
          <section aria-labelledby={`privacy-section-${index}`} className="privacy-section" key={section.title}>
            <h2 id={`privacy-section-${index}`}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <p className="privacy-contact">
          Privacy contact: <a href="mailto:contact@coupreshfunds.com">contact@coupreshfunds.com</a>
        </p>
      </article>

      <footer className="privacy-footer">
        <Link to="/">CouPreshFund</Link>
        <span>Privacy Policy · Effective November 14, 2026</span>
      </footer>
    </main>
  )
}
