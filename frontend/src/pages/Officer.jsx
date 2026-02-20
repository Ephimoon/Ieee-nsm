import React, { useState } from "react";
import Layout from "../components/Layout";
import "./Officer.css";
import linkedinLogo from "../images/image 10.png";
import discordIcon from "../images/discord-icon.png";
import defaultImage from "../images/white ieensm logo (1).png";
//import livImage from "../images/officer-images/LivImage.jpg";
//import vincentImage from "../images/officer-images/VincentImage.jpg";
//import samImage from "../images/officer-images/SamImage.jpg";
import carlImage from "../images/officer-images/CarlImage.jpg";
import miaImage from "../images/officer-images/MiaImage.jpg";
//import gabrielImage from "../images/officer-images/GabrielImage.jpg";
import dominicImage from "../images/officer-images/DominicImage.jpg";
import EmmaImage from "../images/officer-images/EmmaImage.jpg";
import IsabellaImage from "../images/officer-images/IsabellaImage.jpg";
//import ErinImage from "../images/officer-images/ErinImage.jpg";
import NaomiImage from "../images/officer-images/NaomiImage.jpg";
//import OreImage from "../images/officer-images/OreImage.jpg";
import FarihaImage from "../images/officer-images/FarihaImage.jpg";
import MelanieImage from "../images/officer-images/MelanieImage.jpg";
import MaryamImage from "../images/officer-images/MaryamImage.jpg";
import JoshImage from "../images/officer-images/JoshImage.jpg";
import PavanImage from "../images/officer-images/PavankumarImage.png";
//import JacquelineImage from "../images/officer-images/JacquelineImage.jpg";
//import AngelaImage from "../images/officer-images/AngelaImage.jpg";
//import GabrielaImage from "../images/officer-images/GabrielaImage.jpg";
import TanImage from "../images/officer-images/TanImage.jpg";
import classroomImage from "../images/classroom-with-background.png";
import GraceImage from "../images/officer-images/GraceImage.jpg";
import MohamedImage from "../images/officer-images/MohamedImage.jpg";
import DanImage from "../images/officer-images/DanImage.jpg";
import RishanImage from "../images/officer-images/RishanImage.jpg";


class OfficerInfo {
  constructor(
    id,
    position,
    name,
    img = defaultImage,
    linkedinUrl = "",
    discordUsername = ""
  ) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.imageUrl = img;
    this.linkedinUrl = linkedinUrl;
    this.discordUsername = discordUsername;
  }
}

const officers = [
  new OfficerInfo(
    1,
    "President",
    "Grace Roper",
    GraceImage,
    "https://www.linkedin.com/in/grace-roper-443206364/"
  ),
  new OfficerInfo(
    2,
    "Vice President Internal",
    "Dominic McDonald",
    dominicImage,
    "https://www.linkedin.com/in/dominic-mcdonald-uh/"
  ),
  new OfficerInfo(
    3,
    "Vice President External",
    "Dan Bizman",
    DanImage,
    "",
    "@iamdanjamin"
  ),
  new OfficerInfo(
    4,
    "Treasurer",
    "Maryam Ahmed",
    MaryamImage,
    "https://www.linkedin.com/in/maryam-ahmed-54b471215/",
    ""
  ),
  new OfficerInfo(
    5,
    "Treasurer",
    "Maryam Ahmed",
    MaryamImage,
    "https://www.linkedin.com/in/maryam-ahmed-54b471215/",
    ""
  ),
  new OfficerInfo(
    6,
    "Secretary",
    "Carl Aguinaldo",
    carlImage,
    "https://www.linkedin.com/in/carl425/"
  ),
  new OfficerInfo(
    7,
    "Historian",
    "Mia Borbon",
    miaImage,
    "https://www.linkedin.com/in/dillianemiaborbon/"
  ),
  new OfficerInfo(
    8,
    "Events Chair",
    "Jaden Binh",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    9,
    "Events Committee",
    "Emma Nguyen",
    EmmaImage,
    "https://www.linkedin.com/in/emma-nguyen05/"
  ),
  new OfficerInfo(
    10,
    "Events Committee",
    "Naomi Thomas",
    NaomiImage,
    "https://www.linkedin.com/in/naomi-thomas-625385291/"
  ),
  new OfficerInfo(
    11,
    "Marketing Chair",
    "Isabella Truong",
    IsabellaImage,
    "https://www.linkedin.com/in/isabella-truong/"
  ),
  new OfficerInfo(
    12,
    "Marketing Committee",
    "Zaria Saeed",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    13,
    "Marketing Committee",
    "Zaria Saeed",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    14,
    "Graphic Designer",
    "Aidan Bolton",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    15,
    "Graphic Designer",
    "Ciara Miles",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    16,
    "Graphic Designer",
    "Ciara Miles",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    17,
    "Graphic Designer",
    "Claudette Sanchez",
    defaultImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    18,
    "Webmaster",
    "Melanie Escobar Marulanda",
    MelanieImage,
    "https://www.linkedin.com/in/melanie-escobar-marulanda/"
  ),
  new OfficerInfo(
    19,
    "Co-Webmaster",
    "Fariha Adil",
    FarihaImage,
    "https://www.linkedin.com/in/fariha-adil-844496277/"
  ),
  new OfficerInfo(
    20,
    "Co-Webmaster",
    "Rishan Sivakumar",
    RishanImage,
    "https://www.linkedin.com/"
  ),
  new OfficerInfo(
    21,
    "Research Chair",
    "Joshua Novak",
    JoshImage,
    "https://www.linkedin.com/in/alrightytighty/",
    ""
  ),
  new OfficerInfo(
    22,
    "Research Chair",
    "Pavankumar Gali",
    PavanImage,
    "https://www.linkedin.com/in/pavankumar-gali/"
  ),
];

const ieeeNSMCompetitions = [
  new OfficerInfo(
    101,
    "Competitions Branch Head",
    "Mohamed",
    MohamedImage,
    "https://www.linkedin.com/",
    ""
  ),
  new OfficerInfo(
    102,
    "Competitions Branch Committee",
    "Zariah Arrington",
    defaultImage,
    "https://www.linkedin.com/",
    ""
  ),
  new OfficerInfo(
    103,
    "Competitions Branch Committee",
    "Kyron Castellanos",
    defaultImage,
    "https://www.linkedin.com/",
    ""
  ),
  new OfficerInfo(
    104,
    "Competitions Branch Committee",
    "Danish Jamal",
    MaryamImage,
    "https://www.linkedin.com/",
    ""
  ),
  new OfficerInfo(
    105,
    "Competitions Branch Committee",
    "Duy Bao Nguyen",
    TanImage,
    "https://www.linkedin.com/",
    ""
  ),
];

function DiscordIcon({ username }) {
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (copied) {
      setShowPopup(false);
      setCopied(false);
    } else if (!showPopup) {
      setShowPopup(true);
    } else {
      navigator.clipboard.writeText(username).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowPopup(false);
        }, 1500);
      });
    }
  };

  return (
    <div className="discord-container">
      <img
        src={discordIcon}
        alt="Discord Username"
        className="discord-icon"
        onClick={handleClick}
      />
      {showPopup && (
        <div
          className={`discord-popup ${copied ? "copied-tooltip" : ""}`}
          onClick={handleClick}
        >
          {copied ? "Copied!" : username}
        </div>
      )}
    </div>
  );
}

function OfficerCard({ officer }) {
  return (
    <div className="officer-card">
      <div className="officer-image-container">
        <img
          src={officer.imageUrl}
          alt={officer.name}
          className="officer-image"
        />
      </div>
      <h3 className="officer-name">{officer.name}</h3>
      <p className="officer-position">{officer.position}</p>
      <div className="icon-corner bottom-right">
        {officer.linkedinUrl && (
          <a
            className="linkedin-link"
            href={officer.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={linkedinLogo}
              alt="LinkedIn Profile"
              className="linkedin-icon"
            />
          </a>
        )}
        {officer.discordUsername && (
          <DiscordIcon username={officer.discordUsername} />
        )}
      </div>
    </div>
  );
}

function Officer() {
  return (
    <Layout>
      <div id="officer-page" style={{ backgroundColor: "#f0f0f0" }}>
        <div id="parent">
          <div id="left">
            <h1>Who We Are</h1>
            <p>
              We’re IEEE NSM — a student-led organization for CS students in the
              Natural Sciences and Math college at UH. We host coding
              competitions, workshops, and help connect students with research
              opportunities. Whether you’re new to code or training for ICPC,
              we’re here to help you grow your skills, explore your passions,
              and meet like-minded students.
            </p>
          </div>
          <div className="image-wrapper">
            <img
              src={classroomImage}
              alt="classroom"
              className="classroom-image"
            />
          </div>
        </div>
        <div id="f0f0f0"></div>

        {/* Executive Board Section */}
        <div className="officer-section">
          <div className="officer-title-container">
            <div className="officer-title-wrapper">
              <div className="officer-title-shadow"></div>
              <div className="officer-title-box">
                <span className="officer-title-bold">Meet the </span>
                <span className="officer-title-blue">Officers</span>
              </div>
            </div>
          </div>
          <section className="officer-grid">
            {officers.map((officer) => (
              <OfficerCard key={officer.id} officer={officer} />
            ))}
          </section>
        </div>

        {/* ieeeNSMCompetitions Section */}
        <div className="officer-section">
          <div className="officer-title-container">
            <div className="officer-title-wrapper">
              <div className="officer-title-shadow"></div>
              <div className="officer-title-box">
                <span className="officer-title-bold">Meet the </span>
                <span className="officer-title-blue">IEEE-NSM Competitions</span>
              </div>
            </div>
          </div>
          <section className="officer-grid">
            {ieeeNSMCompetitions.map((officer) => (
              <OfficerCard key={officer.id} officer={officer} />
            ))}
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Officer;