import React from 'react';
import { useState } from 'react';

import './Home.css';
import CalendarComponent from '../components/CalendarComponent.jsx';
import Layout from '../components/Layout';
import banner from '../images/ieee nsm banner (1).png';
import olivia from '../images/Olivia holding image (1).png';
/*import bluediscord from '../images/discord.png'
import bluelinkedin from '../images/linkedin.png';
import friends from '../images/smiling friends (1).png';*/

// commenting out these imports because they cause ESLint issues, lmk if we actually needed them or not pls :heart:

function Home() {


  const [contactFormResponse, setContactFormResponse] = useState("");

  const handleSubmit = async (formEventData) => {
      formEventData.preventDefault();
      try {
      const result = await fetch("https://www.baddle.fun/api/contact-ieee", {
        method: "POST",
        body: JSON.stringify({name: formEventData.target.name.value, email: formEventData.target.email.value, role: formEventData.target.role.value, message: formEventData.target.message.value})
      });
      console.log(result);
      if (result.status == 200)
        setContactFormResponse("Message Sent!");
      else
        setContactFormResponse(result.statusText);
      } catch (e)
      {
        setContactFormResponse("Message failed to send. Please ensure that all fields are valid.")
        console.log(e);
      }
      setTimeout(() => setContactFormResponse(""), 3000);
  }

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

        {/* Mission Section with Image */}
        <section className="mission-section">
          <div className="mission-content">
            <h3>Our Mission</h3>
            <p>
              IEEE's core purpose is to foster technological innovation and excellence. 
              We strive to create a space where students can find community and more 
              accessible opportunities for research and competitions.
            </p>
          </div>
          <div className="mission-image">
            
            <img src={olivia} alt="IEEE Member" />
          </div>
          
          <button>Become a Member</button>
        </section>

        {/*Events Section*/}
        <section className="events-section">
            <CalendarComponent />

        </section>

        {/* Membership Form */}
        <section className="membership-form">
          <div className ="form-inner">
          <h3>Contact Us</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name (required)</label>
                <input type="text" name="name" id="name" required />
                <input type="hidden" name="_subject" value="New submission!"></input>
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
                  <option value="representative">A Company Representative</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea name="message">

                </textarea>
              </div>
              <button type="submit" className="submit-btn">Send</button>
            </div>
          </form>
          <div className="form-result-text">
            {contactFormResponse}
          </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;