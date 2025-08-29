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
      if (result.status == 200) setContactFormResponse("Message Sent!");
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
            <p>
              IEEE's core purpose is to foster technological innovation and{" "}
              <br className="desktop-break" />
              excellence for the benefit of humanity. We strive to create a{" "}
              <br className="desktop-break" />
              space where students can find community and more accessible{" "}
              <br className="desktop-break" />
              opportunities for research and competitions.
            </p>
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

          <button
            className="join-btn"
            onClick={() =>
              document
                .getElementById("contact-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Become a Member
          </button>
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
