import React, { useState } from 'react';
import './BM.css';
import Layout from '../components/Layout';

const initialState = {
  firstName: '',
  lastName: '',
  cougarnetEmail: '',
  discordUsername: '',
  classification: '',
  roleInterested: '',
  shirtSize: '',
  website: '' // honeypot
};

const CLASSIFICATION_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const ROLE_OPTIONS = ['Member', 'Officer'];
const SHIRT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function validate(values) {
  const e = {};
  if (!values.firstName.trim()) e.firstName = 'Required';
  if (!values.lastName.trim()) e.lastName = 'Required';
  if (!values.cougarnetEmail.trim()) e.cougarnetEmail = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.cougarnetEmail)) e.cougarnetEmail = 'Invalid';
  if (!values.classification) e.classification = 'Required';
  if (!values.roleInterested) e.roleInterested = 'Required';
  if (!values.shirtSize) e.shirtSize = 'Required';
  return e;
}

export default function BecomeMember() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function handleChange(ev) {
    const { name, value } = ev.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (form.website) return; // bot trap
    setSubmitError('');
    setSubmitted(false);
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
        cougarnetEmail: form.cougarnetEmail,
        discordUsername: form.discordUsername,
        classification: form.classification,
        roleInterested: form.roleInterested,
        shirtSize: form.shirtSize,
        // Compatibility aliases for existing sheet/app-script mappings.
        email: form.cougarnetEmail,
        discord: form.discordUsername
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      });

      const responseText = await res.text();
      let responseJson = null;
      if (responseText) {
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = null;
        }
      }

      if (res.ok && (responseJson?.ok ?? true)) {
        setSubmitted(true);
        setForm(initialState);
      } else {
        const errorMessage =
          responseJson?.error || `Submission failed (${res.status})`;
        setSubmitError(errorMessage);
        console.error('Submission failed', res.status, responseText);
      }
    } catch (e) {
      setSubmitError('Network error. Please try again.');
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
        {submitError && <div className="member-form-error">{submitError}</div>}
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
            label="Cougarnet Email"
            name="cougarnetEmail"
            type="email"
            value={form.cougarnetEmail}
            onChange={handleChange}
            error={errors.cougarnetEmail}
            required
          />
          <FormField
            label="Discord Username"
            name="discordUsername"
            value={form.discordUsername}
            onChange={handleChange}
          />
          <RadioGroupField
            label="Classification"
            name="classification"
            value={form.classification}
            onChange={handleChange}
            options={CLASSIFICATION_OPTIONS}
            error={errors.classification}
            required
          />
          <RadioGroupField
            label="Role interested"
            name="roleInterested"
            value={form.roleInterested}
            onChange={handleChange}
            options={ROLE_OPTIONS}
            error={errors.roleInterested}
            required
          />
          <RadioGroupField
            label="Shirt Size"
            name="shirtSize"
            value={form.shirtSize}
            onChange={handleChange}
            options={SHIRT_SIZE_OPTIONS}
            error={errors.shirtSize}
            required
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
        {label}
        {required && ' *'}
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

function RadioGroupField({ label, name, value, onChange, options, error, required }) {
  return (
    <fieldset className={`member-form-field member-form-radio-group ${error ? 'has-error' : ''}`}>
      <legend>
        {label}
        {required && ' *'}
      </legend>
      <div className="member-form-radio-options">
        {options.map(option => (
          <label key={option} className="member-form-radio-option">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              required={required}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error && <div className="error-msg">{error}</div>}
    </fieldset>
  );
}
