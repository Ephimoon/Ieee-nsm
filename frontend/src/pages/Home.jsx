import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";

import "./Home.css";
import Layout from "../components/Layout";
import galentines from "../images/galentines.jpg";
import friends from "../images/socials.jpg";
import matcha from "../images/matcha.png";
import officers from "../images/officers.jpg";
import officers2 from "../images/officers2.jpg";
import research from "../images/research.jpg";
import social2 from "../images/social2.jpg";
import socials from "../images/socials.jpg";
import working from "../images/working.png";
import CSGirlsLogo from "../images/logos/CSgirlsLOGO.png";
import CodeCoogsLogo from "../images/logos/CodeCoogsLOGO.png";
import ColorStackLogo from "../images/logos/ColorStackLOGO.jpg";
import IEEEUHLogo from "../images/logos/IEEEUHLOGO.png";
import VariableProximity from "../components/VariableProximity";

const DISCORD_URL = "https://discord.gg/nXx9UtEeyy";
const INSTAGRAM_URL = "https://www.instagram.com/ieee_nsm/";
const LINKEDIN_URL =
  "https://www.linkedin.com/company/ieee-nsm/posts/?feedView=all";

/*import bluediscord from '../images/discord.png'
import bluelinkedin from '../images/linkedin.png';*/

// commenting out these imports because they cause ESLint issues, lmk if we actually needed them or not pls :heart:

const PARTNERS = [
  {
    name: "CSGirls",
    href: "https://www.csgirls.org/",
    img: CSGirlsLogo,
    alt: "CSgirls logo",
  },
  {
    name: "CodeCoogs",
    href: "https://www.codecoogs.com/",
    img: CodeCoogsLogo,
    alt: "CodeCoogs logo",
  },
  {
    name: "ColorStack @ UH",
    href: "https://colorstackuh.org/",
    img: ColorStackLogo,
    alt: "ColorStack @ UH logo",
  },
  // {
  //   name: "Cougarettes",
  //   href: "https://uhcougarettes.com/",
  //   img: CougarettesLogo,
  //   alt: "Cougarettes logo",
  // },
  {
    name: "IEEE University of Houston",
    href: "https://ieeeuh.org/",
    img: IEEEUHLogo,
    alt: "IEEE UH logo",
  },
];

const HERO_SLIDES = [
  {
    src: officers2,
    alt: "IEEE-NSM officers together",
  },
  {
    src: galentines,
    alt: "IEEE-NSM members at the Galentines event",
  },
  {
    src: matcha,
    alt: "IEEE-NSM members at the matcha social",
  },
  {
    src: officers,
    alt: "IEEE-NSM officers at a chapter event",
  },
  {
    src: social2,
    alt: "IEEE-NSM members at a social event",
  },
  {
    src: working,
    alt: "IEEE-NSM members working together",
  },
];

const HERO_TYPED_TEXT = "IEEE-NSM";

function Home() {
  const formRef = useRef(null);
  const [contactFormResponse, setContactFormResponse] = useState("");
  const bmFormUrl = process.env.REACT_APP_BM_FORM_URL?.trim();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [typedHeroText, setTypedHeroText] = useState("");
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [typingRunKey, setTypingRunKey] = useState(0);
  const heroSectionRef = useRef(null);
  const missionTextRef = useRef(null);
  const wasHeroVisibleRef = useRef(false);

  useEffect(() => {
    if (!isHeroVisible) return undefined;

    const sliderId = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 4000);

    return () => window.clearInterval(sliderId);
  }, [isHeroVisible]);

  useEffect(() => {
    if (!heroSectionRef.current) return;
    if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
      setIsHeroVisible(true);
      return undefined;
    }

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsHeroVisible(isVisible);

        if (isVisible && !wasHeroVisibleRef.current) {
          setTypedHeroText("");
          setTypingRunKey((current) => current + 1);
        }

        wasHeroVisibleRef.current = isVisible;
      },
      { threshold: 0.4 }
    );

    heroObserver.observe(heroSectionRef.current);
    return () => heroObserver.disconnect();
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll(".pillar-card"));
    if (!cards.length) return undefined;

    cards.forEach((card) => card.classList.remove("is-visible"));

    if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const targetCard = entry.target;
          const shouldShow =
            entry.isIntersecting && entry.intersectionRatio >= 0.12;

          if (shouldShow) {
            if (targetCard.classList.contains("is-visible")) return;
            window.requestAnimationFrame(() => {
              targetCard.classList.add("is-visible");
            });
            return;
          }

          targetCard.classList.remove("is-visible");
        });
      },
      {
        threshold: [0, 0.12, 0.3],
        rootMargin: "0px 0px -4% 0px",
      }
    );

    cards.forEach((card, index) => {
      card.style.setProperty("--pillar-delay", `${index * 90}ms`);
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHeroVisible) return;
    if (typedHeroText === HERO_TYPED_TEXT) return;

    const typingId = window.setTimeout(() => {
      const nextLength = typedHeroText.length + 1;
      setTypedHeroText(HERO_TYPED_TEXT.slice(0, nextLength));
    }, 110);

    return () => window.clearTimeout(typingId);
  }, [typedHeroText, isHeroVisible, typingRunKey]);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSending(true);
    setContactFormResponse("Sending...");

    try {
      await emailjs.sendForm(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        formRef.current,
        { publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY }
      );

      setContactFormResponse("Sent successfully! We'll get back to you soon.");
      formRef.current.reset();
    } catch (error) {
      console.error("EmailJS Error:", error); 
      setContactFormResponse("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="home-container">
        {/* Hero */}
        <section
          className="landing-hero"
          aria-label="IEEE-NSM hero"
          ref={heroSectionRef}
        >
          <div className="landing-hero-wrap">
            <div className="landing-hero-left">
              <p className="landing-hero-kicker">University of Houston</p>
              <h1 className="landing-hero-title">
                <span>{typedHeroText}</span>
                <span className="landing-hero-cursor" aria-hidden="true">
                  |
                </span>
              </h1>
              <p className="landing-hero-tagline">
                Research, competitions, and community.
              </p>

              <div className="landing-hero-actions">
                {bmFormUrl ? (
                  <a className="landing-hero-btn hero-primary" href={bmFormUrl}>
                    Become a Member
                  </a>
                ) : (
                  <Link className="landing-hero-btn hero-primary" to="/bm">
                    Become a Member
                  </Link>
                )}
                <a className="landing-hero-btn hero-secondary" href="#contact-form">
                  Contact Us
                </a>
              </div>
            </div>

            <div className="landing-hero-right">
              <div className="landing-hero-slides">
                <img
                  src={HERO_SLIDES[activeHeroSlide].src}
                  alt={HERO_SLIDES[activeHeroSlide].alt}
                  className="landing-hero-slide is-active"
                  loading="eager"
                  decoding="async"
                />
                <div className="landing-hero-dots" aria-label="Hero slideshow">
                  {HERO_SLIDES.map((slide, index) => (
                    <button
                      key={`hero-dot-${slide.alt}`}
                      className={`landing-hero-dot${
                        index === activeHeroSlide ? " is-active" : ""
                      }`}
                      onClick={() => setActiveHeroSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === activeHeroSlide}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h3>Our Mission</h3>
            <p className="mission-proximity-paragraph">
              <span ref={missionTextRef} className="mission-proximity-container">
                <VariableProximity
                  label="The Institute of Electrical and Electronics Engineers at the Natural Sciences and Mathematics Department exists to foster technological innovation and excellence for the benefit of humanity. We strive to create a space where students find community and gain more accessible opportunities for research and competitions."
                  className="mission-variable-proximity"
                  fromFontVariationSettings="'wght' 420, 'opsz' 10"
                  toFontVariationSettings="'wght' 920, 'opsz' 40"
                  containerRef={missionTextRef}
                  radius={110}
                  falloff="linear"
                />
              </span>
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="pillars-section" aria-label="What we offer">
          <div className="pillars-shell">
            <h3 className="pillars-heading">What we offer</h3>
            <p className="pillars-subtext">
              Explore the opportunities and resources available to IEEE-NSM
              members.
            </p>
            <div className="pillars-wrap">
              <article
                className="pillar-card pillar-card-research"
                aria-labelledby="pillar-research"
              >
                <figure className="pillar-photo">
                  <img
                    src={research}
                    alt="IEEE-NSM members collaborating on research at a table"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption id="pillar-research" className="pillar-photo-title">
                    <span className="pillar-title-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 21h8" />
                        <path d="M7 21v-3l2-2 2 2v3" />
                        <path d="M11 8 8 5" />
                        <path d="m14 11 5-5" />
                        <path d="M12 10h4" />
                        <path d="M14 8v4" />
                        <circle cx="17.5" cy="6.5" r="2.5" />
                      </svg>
                    </span>
                    <span className="pillar-title-text">Research</span>
                  </figcaption>
                </figure>
                <div className="pillar-content">
                  <p>
                    Connect students to faculty-led research opportunities and
                    guide their first steps into academia.
                  </p>
                  <ul>
                    <li>Work directly with professors</li>
                    <li>Gain hands-on technical experience</li>
                    <li>
                      Join workshops that demystify the full research process
                    </li>
                  </ul>
                </div>
              </article>

              <article
                className="pillar-card pillar-card-competitions"
                aria-labelledby="pillar-cp"
              >
                <figure className="pillar-photo">
                  <img
                    src={friends}
                    alt="IEEE-NSM member presenting chapter activities"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption id="pillar-cp" className="pillar-photo-title">
                    <span
                      className="pillar-title-icon pillar-title-icon-code"
                      aria-hidden="true"
                    >
                      &lt;/&gt;
                    </span>
                    <span className="pillar-title-text">
                      Competitions
                    </span>
                  </figcaption>
                </figure>
                <div className="pillar-content">
                  <p>Sharpen problem-solving and core DS&amp;A skills.</p>
                  <ul>
                    <li>
                      Learn key patterns in our LeetCode Support Group
                    </li>
                    <li>Practice consistently with peers and mentors</li>
                    <li>Train for ICPC and other coding competitions</li>
                  </ul>
                  <a
                    className="pillar-branch-btn"
                    href="https://discord.gg/gqrymuagzC"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Competitions Discord
                  </a>
                </div>
              </article>

              <article
                className="pillar-card pillar-card-community"
                aria-labelledby="pillar-community"
              >
                <figure className="pillar-photo">
                  <img
                    src={socials}
                    alt="IEEE-NSM members smiling together in community"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption
                    id="pillar-community"
                    className="pillar-photo-title"
                  >
                    <span className="pillar-title-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="9" cy="8" r="2.8" />
                        <circle cx="16" cy="8.5" r="2.4" />
                        <path d="M3.8 19.5v-.8a5.4 5.4 0 0 1 10.8 0v.8" />
                        <path d="M13.6 19.5v-.6a4.5 4.5 0 0 1 7.2-3.6" />
                      </svg>
                    </span>
                    <span className="pillar-title-text">
                      Community
                    </span>
                  </figcaption>
                </figure>
                <div className="pillar-content">
                  <p>
                    Join a supportive community focused on helping you grow
                    academically, professionally, and personally.
                  </p>
                  <ul>
                    <li>Meet peers through socials and chapter events</li>
                    <li>Get guidance through peer mentoring at UH</li>
                    <li>Build confidence through technical and career workshops</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="post-pillars-links-section" aria-label="Stay connected">
          <div className="post-pillars-links-inner">
            <h3 className="post-pillars-links-heading">Ways To Stay Updated</h3>
            <p className="post-pillars-links-subtext">
              Check us out across our channels for announcements, highlights,
              and chapter updates.
            </p>

            <div className="post-pillars-links-wrap">
              <a
                className="post-pillars-link-item is-discord-card"
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Discord"
              >
                <span className="post-pillars-link-icon is-discord" aria-hidden="true" />
                <span className="post-pillars-link-label">Discord</span>
                <span className="post-pillars-link-note">Join our community</span>
              </a>

              <a
                className="post-pillars-link-item is-instagram-card"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Instagram"
              >
                <span className="post-pillars-link-icon is-instagram" aria-hidden="true" />
                <span className="post-pillars-link-label">Instagram</span>
                <span className="post-pillars-link-note">Follow us for updates</span>
              </a>

              <a
                className="post-pillars-link-item is-linkedin-card"
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open LinkedIn"
              >
                <span className="post-pillars-link-icon is-linkedin" aria-hidden="true" />
                <span className="post-pillars-link-label">LinkedIn</span>
                <span className="post-pillars-link-note">Connect professionally</span>
              </a>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section
          className="partners-section"
          aria-labelledby="partners-heading"
        >
          <div className="partners-inner">
            <h3 id="partners-heading">Our Partners</h3>
            <p className="partners-description">
              We are grateful to these organizations for partnering with us on
              events, workshops, and student opportunities.
            </p>

            <ul className="partners-grid">
              {PARTNERS.map((p) => (
                <li key={p.name} className="partner-card">
                  <a
                    className="partner-link"
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <figure className="partner-figure">
                      <img src={p.img} alt={p.alt || p.name} loading="lazy" />
                    </figure>
                    <span className="partner-name">{p.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Membership Form */}
        <section id="contact-form" className="membership-form">
          <div className="form-inner contact-form-grid">
            <div className="contact-copy">
              <h3>Contact Us</h3>
              <p>
                If you&apos;re a company interested in sponsoring IEEE-NSM, a
                student organization looking to collaborate, or a student/alum
                reaching out, fill out the form and we&apos;ll get back to you.
              </p>
            </div>

            <div className="contact-form-card">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-grid-two">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input type="text" name="name" id="name" required />
                    <input
                      type="hidden"
                      name="_subject"
                      value="New submission!"
                    ></input>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" name="email" id="email" required />
                  </div>
                </div>

                <fieldset className="role-toggle-fieldset">
                  <legend>I am...</legend>
                  <div className="role-toggle-grid">
                    <label className="role-toggle-option">
                      <input
                        type="radio"
                        name="role"
                        value="faculty"
                        defaultChecked
                        required
                      />
                      <span>Sponsor</span>
                    </label>
                    <label className="role-toggle-option">
                      <input type="radio" name="role" value="representative" />
                      <span>Company Rep</span>
                    </label>
                    <label className="role-toggle-option">
                      <input type="radio" name="role" value="student" />
                      <span>Student</span>
                    </label>
                    <label className="role-toggle-option">
                      <input type="radio" name="role" value="professional" />
                      <span>Alum</span>
                    </label>
                  </div>
                </fieldset>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea name="message" id="message" required></textarea>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </form>
              <div className="form-result-text">{contactFormResponse}</div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;
