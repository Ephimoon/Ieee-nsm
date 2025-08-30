import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Layout.css";
import whiteieee from "../images/white ieensm logo (1).png";
import insta from "../images/Group 3.png";
import linkedin from "../images/image 10.png";
import discord from "../images/image 11.png";

const Layout = ({ children }) => {
  // State to manage mobile menu open/close
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef(null);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial set
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="layout-container">
      <nav className="navbar" ref={navRef}>
        <div className="nav-container">
          {/* Logo and Title Group */}
          <div className="logo-title-group">
            <Link to="/" className="nav-logo">
              <img src={whiteieee} className="whitelogo" alt="logo" />
              <h1 className="nav-title">IEEE-NSM</h1>
            </Link>
          </div>

          {/* Desktop + Mobile Navigation */}
          <div className={`nav-links ${menuOpen ? "active" : ""}`}>
            <Link
              to="/"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/officers"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Officers
            </Link>
            <Link
              to="/events"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Events
            </Link>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
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
      <main className="main-content" style={{ paddingTop: `${navHeight}px` }}>
        {children}
      </main>

      {/* Footer with Social Icons */}
      <footer className="footer">
        <div className="footer-content">
          <div className="logo-title-group">
            <Link to="/" className="nav-logo">
              <img src={whiteieee} className="whitelogo" alt="logo" />
            </Link>
            <h1 className="nav-title">IEEE-NSM</h1>
          </div>
          <div className="social-icons">
            <a
              href="https://www.instagram.com/ieee_nsm/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={insta} alt="Instagram" className="social-icon" />
            </a>
            <a
              href="https://www.linkedin.com/company/ieee-nsm/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={linkedin} alt="LinkedIn" className="social-icon" />
            </a>
            <a
              href="https://discord.gg/nXx9UtEeyy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={discord} alt="Discord" className="social-icon" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
