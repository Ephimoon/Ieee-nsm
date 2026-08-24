import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Layout.css";
import ieeelogo from "../images/logos/IEEE-CS Logo.png";
import insta from "../images/logos/instagram-logo.png";
import linkedin from "../images/logos/linkedin-logo.png";
import discord from "../images/logos/discord-logo.png";


const Layout = ({ children }) => {
  const bmFormUrl = process.env.REACT_APP_BM_FORM_URL?.trim();
  const currentYear = new Date().getFullYear();

  // State to manage mobile menu open/close
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef(null);

  // Close menu on resize to desktop
  useEffect(() => {
    const updateNavHeight = () => {
      if (!navRef.current) return;
      // Use precise measured height and round up to avoid 1px seam/gaps.
      const height = Math.ceil(navRef.current.getBoundingClientRect().height);
      setNavHeight(height);
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
      updateNavHeight();
    };

    window.addEventListener("resize", handleResize);

    let resizeObserver;
    if (window.ResizeObserver && navRef.current) {
      resizeObserver = new ResizeObserver(() => updateNavHeight());
      resizeObserver.observe(navRef.current);
    }

    updateNavHeight();
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, []);

  // Show bottom shadow only after page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="layout-container"
      style={{ "--nav-height": `${navHeight}px` }}
    >
      <nav className={`navbar${isScrolled ? " navbar-scrolled" : ""}`} ref={navRef}>
        <div className="nav-container">
          {/* Logo and Title Group */}
          <div className="logo-title-group">
            <Link to="/" className="nav-logo">
              <img src={ieeelogo} className="whitelogo" alt="logo" />
              <h1 className="nav-title">IEEE-CS</h1>
            </Link>
          </div>

          {/* Desktop + Mobile Navigation */}
          <div className={`nav-links ${menuOpen ? "active" : ""}`}>
            <NavLink
              end
              to="/"
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/officers"
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              Officers
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              Events
            </NavLink>
            {bmFormUrl ? (
              <a
                href={bmFormUrl}
                className="nav-link nav-link-cta"
                onClick={() => setMenuOpen(false)}
              >
                Become a Member
              </a>
            ) : (
              <NavLink
                to="/bm"
                className={({ isActive }) =>
                  `nav-link nav-link-cta${isActive ? " nav-link-active" : ""}`
                }
                onClick={() => setMenuOpen(false)}
              >
                Become a Member
              </NavLink>
            )}
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              // "X" Icon
              <svg
                className="hamburger-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger Icon
              <svg
                className="hamburger-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main
        className="main-content"
        style={{
          paddingTop: "var(--nav-height)",
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-top">
            <Link to="/" className="nav-logo footer-logo">
              <img src={ieeelogo} className="whitelogo" alt="IEEE-CS logo" />
              <h2 className="footer-brand-name">IEEE-CS</h2>
            </Link>

            <div className="footer-links-row">
              <Link to="/" className="footer-link">
                Home
              </Link>
              <Link to="/officers" className="footer-link">
                Officers
              </Link>
              <Link to="/events" className="footer-link">
                Events
              </Link>
              {bmFormUrl ? (
                <a href={bmFormUrl} className="footer-link">
                  Become a Member
                </a>
              ) : (
                <Link to="/bm" className="footer-link">
                  Become a Member
                </Link>
              )}
              <Link to="/privacy-policy" className="footer-link">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="footer-bottom-row">
            <div className="social-icons">
              <a
                href="https://www.instagram.com/ieee_nsm/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Instagram"
              >
                <img src={insta} alt="Instagram" className="social-icon" />
              </a>
              <a
                href="https://www.linkedin.com/company/ieee-nsm/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="LinkedIn"
              >
                <img src={linkedin} alt="LinkedIn" className="social-icon" />
              </a>
              <a
                href="https://discord.gg/nXx9UtEeyy"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Discord"
              >
                <img src={discord} alt="Discord" className="social-icon" />
              </a>
            </div>
            <p className="footer-bottom">
              &copy; {currentYear} IEEE-CS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
