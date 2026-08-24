import React from "react";
import Layout from "../components/Layout";
import "./PrivacyPolicy.css";

const LAST_UPDATED = "February 21, 2026";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="privacy-page">
        <article className="privacy-card">
          <h1>Privacy Policy</h1>
          <p className="privacy-updated">Last updated: {LAST_UPDATED}</p>

          <p>
            IEEE-CS respects your privacy. This page explains what information
            we collect through this website and how we use it.
          </p>

          <h2>Information We Collect</h2>
          <ul>
            <li>Contact form details such as your name, email, and message.</li>
            <li>Membership form details you submit to join IEEE-CS.</li>
            <li>
              Basic technical data such as browser type and page activity for
              site reliability.
            </li>
          </ul>

          <h2>How We Use Information</h2>
          <ul>
            <li>To respond to questions and membership submissions.</li>
            <li>To share chapter updates and opportunities with members.</li>
            <li>To improve website content and event communication.</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do not sell your personal information. We only share information
            with trusted services required to run IEEE-CS operations, such as
            event tools and form-processing services.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain submitted information only as long as needed for chapter
            operations, legal requirements, or recordkeeping.
          </p>

          <h2>Your Choices</h2>
          <p>
            If you want your submitted data updated or removed, contact an
            IEEE-CS officer through our official communication channels.
          </p>

          <h2>Policy Updates</h2>
          <p>
            This policy may be updated from time to time. Changes are reflected
            on this page with a revised date.
          </p>
        </article>
      </div>
    </Layout>
  );
}
