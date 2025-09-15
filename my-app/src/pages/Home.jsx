import React from "react";
import { useState } from "react";

import "./Home.css";
import CalendarComponent from "../components/CalendarComponent.jsx";
import FullScreenCarousel from "../pages/FullScreenCarousel";
import Layout from "../components/Layout";
import banner from "../images/ieee nsm banner (1).png";
import olivia from "../images/Olivia holding image.png";
import friends from "../images/smiling friends (1).png";
import table from "../images/working at table.jpg";

const DISCORD_URL   = "https://discord.gg/2KtqWSP8t2";
const INSTAGRAM_URL = "https://www.instagram.com/ieee_nsm";
const LINKEDIN_URL  = "https://www.linkedin.com/company/ieee-nsm/";

/*import bluediscord from '../images/discord.png'
import bluelinkedin from '../images/linkedin.png';*/

// commenting out these imports because they cause ESLint issues, lmk if we actually needed them or not pls :heart:

function Home() {
  const [contactFormResponse, setContactFormResponse] = useState("");

  const handleSubmit = async (formEventData) => {
    formEventData.preventDefault();
    try {
      const result = await fetch("https://www.baddle.fun/api/contact-ieee", {
        method: "POST",
        body: JSON.stringify({
          name: formEventData.target.name.value,
          email: formEventData.target.email.value,
          role: formEventData.target.role.value,
          message: formEventData.target.message.value,
        }),
      });
      console.log(result);
      if (result.status === 200) setContactFormResponse("Message Sent!");
      else setContactFormResponse(result.statusText);
    } catch (e) {
      setContactFormResponse(
        "Message failed to send. Please ensure that all fields are valid."
      );
      console.log(e);
    }
    setTimeout(() => setContactFormResponse(""), 3000);
  };

  return (
    <Layout>
      <div className="home-container">
        {/* Hero Banner with Dark Overlay */}
        <div className="hero-banner">
          <div className="banner-overlay"></div>
          <img src={banner} alt="IEEE Banner" className="banner-image" />
          <div className="hero-content">
            <p>University of Houston</p>
            <h1>Institute of Electrical and Electronics Engineers</h1>
          </div>
        </div>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h3>Our Mission</h3>
            <p>IEEE-NSM helps students grow technical skills through <b>research</b> opportunities, <b>competitive programming</b>, and a supportive <b>community</b> so you can learn by doing, publish and present, and land great opportunities.</p>
          </div>
        </section>

        {/* Pillars */}
        <section className="pillars-section" aria-label="What we offer">
          <div className="pillars-wrap">
            <article className="pillar-card" aria-labelledby="pillar-research">
              <div className="pillar-icon" aria-hidden="true">
                {/* magnifying glass */}
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/></svg>
              </div>
              <h4 id="pillar-research">Research</h4>
              <p>Connect students to research opportunities and help them take their first steps into academia</p>
              <ul>
                <li>work directly with professors</li>
                <li>gain hands-on experience</li>
                <li>workshops to demystify research and assist throughout research process</li>
              </ul>
            </article>

            <article className="pillar-card" aria-labelledby="pillar-cp">
              <div className="pillar-icon" aria-hidden="true">
                {/* code brackets */}
                <svg viewBox="0 0 24 24"><polyline points="9 18 3 12 9 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="15 6 21 12 15 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h4 id="pillar-cp">Competitive Programming</h4>
              <p>Sharpen problem-solving and core DS&A skills</p>
              <ul>
                <li>LeetCode Support Group to learn patterns and how to conquer LeetCode problems</li>
                <li>LeetCode support group</li>
                <li>ICPC preparation and support</li>
              </ul>
            </article>

            <article className="pillar-card" aria-labelledby="pillar-community">
              <div className="pillar-icon" aria-hidden="true">
                {/* people */}
                <svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="16" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M3 20c0-3 3-5 5-5s5 2 5 5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M11 20c0-3 3-5 5-5s5 2 5 5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              </div>
              <h4 id="pillar-community">Community & Mentorship</h4>
              <p>We're a small, supportive organization focused on helping you grow while we grow</p>
              <ul>
                <li>Socials to connect you to new friends and find community</li>
                <li>Peer mentoring for guidance throughout your time at UH</li>
                <li>Workshops to help build your skills and explore interests</li>
              </ul>
            </article>
          </div>
        </section>


        {/* Image Collage */}
        <section className="gallery-section">
          <div className="collage-wrap">
            <div className="collage">
              <figure className="card left">
                <img src={olivia} alt="" />
              </figure>
              <figure className="card center">
                <img src={friends} alt="" />
              </figure>
              <figure className="card right">
                <img src={table} alt="" />
              </figure>
            </div>
          </div>

          <FullScreenCarousel images={[olivia, friends, table]} />

          {/* action buttons */}
          <div className="cta-row">
            <a className="join-btn" href="#contact-form">
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                <polyline points="3,7 12,13 21,7" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Contact Us
            </a>

            <a className="join-btn"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer">
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.0371 19.7363 19.7363 0 00-4.8852 1.5152.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.793 8.18 1.793 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9551-2.4189 2.157-2.4189 1.2108 0 2.1757 1.095 2.1568 2.419 0 1.3332-.955 2.4189-2.1569 2.4189zm7.9582 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.955-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.095 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
              Discord
            </a>

            <a className="join-btn"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer">
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <path d="M17.5 6.5h.01" />
              </svg>
              Instagram
            </a>

            <a className="join-btn"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-linkedin" viewBox="0 0 16 16">
                <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
              </svg>
              LinkedIn
            </a>
          </div>

        </section>

        {/*Events Section*/}
        <section className="events-section">
          <CalendarComponent />
        </section>

        {/* Membership Form */}
        <section id="contact-form" className="membership-form">
          <div className="form-inner">
            <h3>Contact Us</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name (required)</label>
                  <input type="text" name="name" id="name" required />
                  <input
                    type="hidden"
                    name="_subject"
                    value="New submission!"
                  ></input>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email (required)</label>
                  <input type="email" name="email" id="email" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">I am...</label>
                  <select type="role" name="role" id="role">
                    <option value="">Select...</option>
                    <option value="student">A Student</option>
                    <option value="professional">An Alum</option>
                    <option value="faculty">A Sponsor</option>
                    <option value="representative">
                      A Company Representative
                    </option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea name="message"></textarea>
                </div>
                <button type="submit" className="submit-btn">
                  Send
                </button>
              </div>
            </form>
            <div className="form-result-text">{contactFormResponse}</div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;
