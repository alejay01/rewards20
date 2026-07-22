import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

const effectiveDate = "July 22, 2026";

const LegalShell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <main className="min-h-screen bg-brand-light px-4 py-8 text-brand-charcoal">
    <div className="mx-auto max-w-3xl">
      <Link to="/join" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to rewards enrollment
      </Link>
      <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg sm:p-10">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <ShieldCheck className="mb-3 h-9 w-9 text-brand-red" />
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          <p className="mt-2 text-xs font-semibold text-gray-500">Effective {effectiveDate}</p>
        </div>
        <div className="space-y-7 text-sm leading-7 text-gray-700">{children}</div>
      </article>
    </div>
  </main>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="mb-2 text-lg font-extrabold text-brand-charcoal">{title}</h2>
    {children}
  </section>
);

export const PrivacyPage: React.FC = () => (
  <LegalShell title="Privacy Policy" subtitle="The Boudin Company and Boudin Rewards loyalty program">
    <Section title="Information we collect">
      <p>We may collect contact information you provide, including your name, email address, mobile number, birthday, favorite products, loyalty activity, rewards, transaction-related information, and your marketing choices. We also retain SMS consent and opt-out records, including the time and source of the request.</p>
    </Section>
    <Section title="How we use information">
      <p>We use this information to operate the Boudin Rewards program, identify your account, calculate points, provide rewards, prevent fraud, support customers, improve our services, and—only when you separately opt in—send rewards and promotional text messages.</p>
    </Section>
    <Section title="Mobile information and SMS consent">
      <p className="font-bold">We do not share mobile information, text messaging originator opt-in data, or SMS consent with third parties or affiliates for their marketing or promotional purposes.</p>
      <p className="mt-2">We may disclose information to service providers that help us operate the program, such as messaging, hosting, database, security, and customer-support providers. Those providers may use the information only to perform services for us and not for their own marketing.</p>
    </Section>
    <Section title="Selling information">
      <p>We do not sell or rent mobile numbers or SMS consent. We do not use purchased, rented, or shared marketing lists for the Boudin Rewards SMS program.</p>
    </Section>
    <Section title="Retention and security">
      <p>We retain loyalty, consent, opt-out, and messaging records for as long as reasonably needed to operate the program, document compliance, resolve disputes, and satisfy legal obligations. We use reasonable administrative and technical safeguards, but no system can guarantee absolute security.</p>
    </Section>
    <Section title="Your choices">
      <p>SMS enrollment is optional and is not a condition of purchase. Reply STOP to any Boudin Rewards message to unsubscribe. Reply HELP for assistance. You may also contact us to request access, correction, or deletion where applicable. Certain transaction, consent, opt-out, security, or legal records may need to be retained.</p>
    </Section>
    <Section title="Children and changes">
      <p>The rewards and marketing program is not directed to children under 13. We may update this policy and will post the updated effective date on this page.</p>
    </Section>
    <Section title="Contact us">
      <p>The Boudin Company, 28115 Southwest Freeway, Rosenberg, TX 77471. Call <a className="font-bold text-brand-red hover:underline" href="tel:+17135615645">713-561-5645</a> or email <a className="font-bold text-brand-red hover:underline" href="mailto:info@theboudincompany.com">info@theboudincompany.com</a>.</p>
    </Section>
  </LegalShell>
);

export const SmsTermsPage: React.FC = () => (
  <LegalShell title="SMS Terms & Conditions" subtitle="The Boudin Company Boudin Rewards text messaging program">
    <Section title="Program description">
      <p>When you opt in, The Boudin Company may send recurring automated Boudin Rewards text messages about loyalty points, earned or available rewards, birthday rewards, restaurant promotions, limited-time offers, customer-care information, and win-back offers.</p>
    </Section>
    <Section title="Consent and eligibility">
      <p>Enrollment is available to people who provide a valid mobile number and affirmatively select the separate SMS consent checkbox. Consent is not a condition of purchasing goods or services. You represent that you are the subscriber or customary user of the number provided and are authorized to enroll it.</p>
    </Section>
    <Section title="Frequency and charges">
      <p>Message frequency varies. Message and data rates may apply according to your wireless plan. Your carrier is not responsible for delayed or undelivered messages.</p>
    </Section>
    <Section title="Stopping messages">
      <p>Reply <strong>STOP</strong> to unsubscribe. We may send one final confirmation message, after which no further marketing messages will be sent unless you provide new consent. Other supported opt-out words may include STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT, REVOKE, and OPTOUT.</p>
    </Section>
    <Section title="Help">
      <p>Reply <strong>HELP</strong> for assistance, call <a className="font-bold text-brand-red hover:underline" href="tel:+17135615645">713-561-5645</a>, email <a className="font-bold text-brand-red hover:underline" href="mailto:info@theboudincompany.com">info@theboudincompany.com</a>, or visit our <Link className="font-bold text-brand-red hover:underline" to="/support">support page</Link>.</p>
    </Section>
    <Section title="Privacy">
      <p>Our <Link className="font-bold text-brand-red hover:underline" to="/privacy">Privacy Policy</Link> explains how we collect, use, retain, and protect information. Mobile information and SMS consent are not shared with third parties or affiliates for their marketing or promotional purposes.</p>
    </Section>
    <Section title="Changes">
      <p>We may modify or discontinue the program as permitted by law. Material changes will be posted here with a revised effective date. Continued participation after a change is subject to any consent requirements that apply.</p>
    </Section>
  </LegalShell>
);

export const SupportPage: React.FC = () => (
  <LegalShell title="Boudin Rewards Support" subtitle="Help with loyalty accounts, rewards, and text messages">
    <Section title="Contact The Boudin Company">
      <div className="grid gap-4 sm:grid-cols-3">
        <a href="tel:+17135615645" className="rounded-2xl border border-gray-200 p-4 hover:border-brand-red">
          <Phone className="mb-2 h-5 w-5 text-brand-red" />
          <span className="block font-bold">713-561-5645</span>
        </a>
        <a href="mailto:info@theboudincompany.com" className="rounded-2xl border border-gray-200 p-4 hover:border-brand-red">
          <Mail className="mb-2 h-5 w-5 text-brand-red" />
          <span className="block break-all font-bold">info@theboudincompany.com</span>
        </a>
        <div className="rounded-2xl border border-gray-200 p-4">
          <MapPin className="mb-2 h-5 w-5 text-brand-red" />
          <span className="block font-bold">28115 Southwest Freeway<br />Rosenberg, TX 77471</span>
        </div>
      </div>
    </Section>
    <Section title="Text message assistance">
      <p>Reply <strong>HELP</strong> to a Boudin Rewards text for help. Reply <strong>STOP</strong> to unsubscribe. For account-specific questions, contact the restaurant using the phone number or email above.</p>
    </Section>
    <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-6">
      <Link className="font-bold text-brand-red hover:underline" to="/sms-terms">SMS Terms</Link>
      <Link className="font-bold text-brand-red hover:underline" to="/privacy">Privacy Policy</Link>
      <a className="font-bold text-brand-red hover:underline" href="https://theboudincompany.com/">Business website</a>
    </div>
  </LegalShell>
);
