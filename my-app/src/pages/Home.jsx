import React from 'react';
import './Home.css';
import CalendarComponent from '../components/CalendarComponent.jsx';
import Layout from '../components/Layout';
import banner from '../images/ieee nsm banner (1).png';
import olivia from '../images/Olivia holding image (1).png';
import friends from '../images/smiling friends (1).png';

function Home() {
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
          <form>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name (required)</label>
                <input type="text" id="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email (required)</label>
                <input type="email" id="email" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">I am...</label>
                <select id="role">
                  <option value="">Select...</option>
                  <option value="student">A Student</option>
                  <option value="professional">An Alum</option>
                  <option value="faculty">A Sponsor</option>
                  <option value="representative">A Company Representative</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea>

                </textarea>
              </div>
              <button type="submit" className="submit-btn">Send</button>
            </div>
          </form>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;