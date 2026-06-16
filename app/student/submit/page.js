"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { getStoredToken } from '@/lib/session';

export default function SubmitEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'seminar',
    date: '',
    time: '',
    venue: '',
    speaker: '',
    capacity: '',
    department: '',
    tags: ''
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getStoredToken();
      if (!token) {
        showToast('Authentication error: No token found. Please log in.', 'error');
        setLoading(false);
        return;
      }

      // Format payload
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      const res = await fetchApi('/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit event');
      }

      showToast('Event submitted successfully!', 'success');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'seminar',
        date: '',
        time: '',
        venue: '',
        speaker: '',
        capacity: '',
        department: '',
        tags: ''
      });
      setStep(1);
      
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '700px', margin: '2rem auto', padding: '2.5rem', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)', textShadow: '0 2px 10px rgba(99, 102, 241, 0.2)' }}>Host New Event ✨</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.05rem' }}>Propose an academic event to be featured on the AEH calendar.</p>
      </div>
      
      {/* Stepper Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative', padding: '0 1rem' }}>
        {[1, 2, 3].map(num => (
          <div key={num} style={{ 
            width: '44px', height: '44px', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: step >= num ? 'var(--accent-primary)' : 'var(--surface-hover)',
            color: step >= num ? '#fff' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '1.1rem', zIndex: 1, 
            border: `2px solid ${step >= num ? 'var(--accent-primary)' : 'var(--border)'}`, 
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: step === num ? '0 0 0 4px rgba(99, 102, 241, 0.2)' : 'none'
          }}>
            {step > num ? '✓' : num}
          </div>
        ))}
        {/* Progress Line */}
        <div style={{ position: 'absolute', top: '21px', left: '32px', right: '32px', height: '3px', backgroundColor: 'var(--surface-hover)', zIndex: 0, borderRadius: '4px' }} />
        <div style={{ position: 'absolute', top: '21px', left: '32px', width: step === 1 ? '0%' : step === 2 ? '50%' : 'calc(100% - 64px)', height: '3px', backgroundColor: 'var(--accent-primary)', zIndex: 0, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '4px' }} />
      </div>

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        <div style={{ minHeight: '320px' }}>
          {step === 1 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>Step 1: Basic Details</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Provide the core information about the event.</p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Event Title <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                <input type="text" id="title" name="title" className="form-input" required value={formData.title} onChange={handleChange} placeholder="e.g. International Conference on Quantum Computing" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="description">Description <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                <textarea id="description" name="description" className="form-input" rows={4} required value={formData.description} onChange={handleChange} placeholder="Describe the objectives and target audience of the event..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="type">Event Type <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                <select id="type" name="type" className="form-select" required value={formData.type} onChange={handleChange}>
                  <option value="seminar">Seminar</option>
                  <option value="workshop">Workshop</option>
                  <option value="lecture">Guest Lecture</option>
                  <option value="conference">Conference</option>
                  <option value="training">Training / Symposium</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>Step 2: Schedule & Venue</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Set the time and location for attendees.</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="date">Date <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                  <input type="date" id="date" name="date" className="form-input" required value={formData.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="time">Time <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                  <input type="time" id="time" name="time" className="form-input" required value={formData.time} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="venue">Venue <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                <input type="text" id="venue" name="venue" className="form-input" required value={formData.venue} onChange={handleChange} placeholder="e.g. ABLT-4, Main Campus" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="speaker">Speaker(s)</label>
                  <input type="text" id="speaker" name="speaker" className="form-input" value={formData.speaker} onChange={handleChange} placeholder="e.g. Dr. Jane Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="capacity">Capacity</label>
                  <input type="number" id="capacity" name="capacity" className="form-input" min="1" value={formData.capacity} onChange={handleChange} placeholder="e.g. 150" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>Step 3: Subjects & Tags</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Help others find your event by tagging it appropriately.</p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="department">Host Department <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                <input type="text" id="department" name="department" className="form-input" required value={formData.department} onChange={handleChange} placeholder="e.g. Computer Science & Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="tags">Subject Tags</label>
                <input type="text" id="tags" name="tags" className="form-input" value={formData.tags} onChange={handleChange} placeholder="e.g. AI, Machine Learning (comma separated)" />
              </div>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>ℹ️</span> <strong>Note:</strong> Since you are a student, your event will be marked as "pending" and must be approved by an Administrator before it becomes publicly visible.
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button type="button" onClick={handlePrev} className="btn btn-ghost btn-lg">
              ← Previous
            </button>
          ) : (
            <div></div> 
          )}

          {step < 3 ? (
            <button type="submit" className="btn btn-primary btn-lg" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
              Continue →
            </button>
          ) : (
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ paddingLeft: '2rem', paddingRight: '2rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting Event...' : 'Submit Event ✨'}
            </button>
          )}
        </div>
      </form>

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          color: '#fff',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(120%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
