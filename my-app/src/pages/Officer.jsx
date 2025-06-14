import React from 'react';
import Layout from '../components/Layout';
import './Officer.css';
import livImage from '../images/officer-images/1747090073158.jpg';

const officers = [
  {
    id: 1,
    name: 'Olivia Wright',
    position: 'President',
    imageUrl: livImage
  },
  {
    id: 2,
    name: 'Vincent DyCruz',
    position: 'Vice President',
    imageUrl: '/images/officers/jane-smith.jpg'
  },
  {
    id: 3,
    name: 'Sam Khudairi',
    position: 'Treasurer',
    imageUrl: '/images/officers/mike-johnson.jpg'
  },
  {
    id: 4,
    name: 'Sarah Williams',
    position: 'Secretary',
    imageUrl: '/images/officers/sarah-williams.jpg'
  },
  // Add more officers as needed
];

function Officer() {
  return (
    <Layout>
      <div id="white"></div>
      <h1>Meet Our Officers</h1>
      <section className="officer-grid">
        {officers.map((officer) => (
          <div key={officer.id} className="officer-card">
            <div className="officer-image-container">
              <img 
                src={officer.imageUrl} 
                alt={officer.name}
                className="officer-image"
              />
            </div>
            <h3 className="officer-name">{officer.name}</h3>
            <p className="officer-position">{officer.position}</p>
            <p className="officer-description">{officer.description}</p>
          </div>
        ))}
      </section>
    </Layout>
  );
}

export default Officer;