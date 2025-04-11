import React, { useState } from 'react';
import { ArrowLeft, AudioWaveform as Waveform, Zap, Brain, Battery, Sparkles, Mail, Send, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/constants';

export default function ScalarHealing() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Send form data to backend for processing
      const response = await axios.post(`${API_URL}/scalar/request-info`, formData);
      
      if (response.data.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        throw new Error(response.data.message || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error('Error submitting scalar healing request:', error);
      setError(error.response?.data?.message || error.message || 'An error occurred while submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-gold-400 hover:text-gold-300">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
          <div className="flex items-center">
            <Waveform className="h-8 w-8 text-gold-500" />
            <span className="ml-2 text-xl font-bold text-white">Quantum Balance</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h1 className="text-3xl font-bold text-white mb-6">Scalar Healing</h1>
          <p className="text-navy-300 leading-relaxed mb-6">
            At Quantum Balance, we explore advanced energy-based approaches to wellness, including Scalar Healing. 
            Scalar waves, also known as longitudinal waves, are a form of energy discovered by Nikola Tesla and 
            later explored in quantum physics. Unlike traditional electromagnetic waves, scalar waves are believed 
            to carry zero-point energy, allowing them to influence the body at a fundamental level, potentially 
            aiding in cellular regeneration, energy balance, and deep relaxation.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How Scalar Distance Healing Works</h2>
          <p className="text-navy-300 leading-relaxed mb-6">
            Scalar energy is unique because it does not weaken over distance. This means healing frequencies 
            can be transmitted remotely, working beyond the limitations of space and time.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-navy-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-gold-400" />
                <h3 className="text-lg font-semibold text-white">Enhanced Communication</h3>
              </div>
              <p className="text-navy-300">Enhance cellular communication and biofeedback</p>
            </div>

            <div className="bg-navy-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-gold-400" />
                <h3 className="text-lg font-semibold text-white">Natural Self-Repair</h3>
              </div>
              <p className="text-navy-300">Support the body's natural self-repair mechanisms</p>
            </div>

            <div className="bg-navy-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Battery className="h-6 w-6 text-gold-400" />
                <h3 className="text-lg font-semibold text-white">Improved Energy</h3>
              </div>
              <p className="text-navy-300">Improve energy levels and mental clarity</p>
            </div>

            <div className="bg-navy-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-gold-400" />
                <h3 className="text-lg font-semibold text-white">Stress Reduction</h3>
              </div>
              <p className="text-navy-300">Reduce stress and promote deep relaxation</p>
            </div>
          </div>
        </div>

        {/* Process Section */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How We Conduct Scalar Healing</h2>
          <p className="text-navy-300 leading-relaxed mb-6">
            Our Scalar Healing sessions are conducted remotely, making them accessible wherever you are. 
            Once you book a session, we will request a recent photograph and basic details (such as name 
            and location). Using specialized scalar wave technology, we encode healing frequencies into 
            the scalar field and direct them toward you. Many people report a sense of calm, improved 
            sleep, and increased energy levels following their sessions.
          </p>
          <p className="text-navy-300 leading-relaxed">
            While scalar healing is not yet widely recognized in mainstream science, those who experience 
            it often find it deeply beneficial.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-navy-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Request More Information</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {success ? (
            <div className="bg-green-900/50 text-green-300 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Thank you for your interest!</h3>
              <p>We'll be in touch with more information about our Scalar Healing services.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy-700 border-navy-600 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-navy-700 border-navy-600 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-navy-700 border-navy-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-300 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-navy-700 border-navy-600 rounded-lg px-4 py-2 text-white"
                  rows={4}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gold-600 text-navy-900 px-6 py-3 rounded-lg font-medium hover:bg-gold-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Send className="w-5 h-5 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Request
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-navy-400">
                  Or email us directly at{' '}
                  <a 
                    href="mailto:info@quantumbalance.co.uk" 
                    className="text-gold-400 hover:text-gold-300"
                  >
                    info@quantumbalance.co.uk
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 