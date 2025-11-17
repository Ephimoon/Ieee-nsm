import React, { useState } from 'react';
import './BM.css';
import Layout from '../components/Layout';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  peopleSoftId: '',
  studentId: '',
  discord: '',
  linkedin: '',
  website: '' // honeypot
};

function validate(values) {
  const e = {};
  if (!values.firstName.trim()) e.firstName = 'Required';
  if (!values.lastName.trim()) e.lastName = 'Required';
  if (!values.email.trim()) e.email = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Invalid';
  if (!values.peopleSoftId.trim()) e.peopleSoftId = 'Required';
  if (!values.studentId.trim()) e.studentId = 'Required';
  return e;
}

export default function BecomeMember() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(ev) {
    const { name, value } = ev.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (form.website) return; // bot trap
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    const endpoint = process.env.REACT_APP_BM_JSON_URL;
    if (!endpoint) {
      console.error('Missing REACT_APP_BM_JSON_URL');
      return;
    }

    setLoading(true);
    try {
      const body = new URLSearchParams({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        peopleSoftId: form.peopleSoftId,
        studentId: form.studentId,
        discord: form.discord,
        linkedin: form.linkedin
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      });

      if (res.ok) {
        setSubmitted(true);
        setForm(initialState);
      } else {
        console.error('Submission failed', res.status);
      }
    } catch (e) {
      console.error('Network error', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
        <div className="member-form-container">
            <h1>Membership Form</h1>
            {submitted && <div className="member-form-success">Submitted!</div>}
            <form onSubmit={handleSubmit} noValidate>
                <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                />
                <FormField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
                />
                <FormField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
                />
                <FormField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                required
                />
                <FormField
                label="PeopleSoft ID #"
                name="peopleSoftId"
                value={form.peopleSoftId}
                onChange={handleChange}
                error={errors.peopleSoftId}
                required
                />
                <FormField
                label="Student ID #"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                error={errors.studentId}
                required
                />
                <FormField
                label="Discord Username"
                name="discord"
                value={form.discord}
                onChange={handleChange}
                />
                <FormField
                label="LinkedIn"
                name="linkedin"
                value={form.linkedin}
                onChange={handleChange}
                />
                <button type="submit" className="member-form-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    </Layout>
  );
}

function FormField({ label, name, value, onChange, error, required, type = 'text' }) {
  return (
    <div className={`member-form-field ${error ? 'has-error' : ''}`}>
      <label>
        {label}{required && ' *'}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="Short answer text"
          required={required}
        />
      </label>
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}