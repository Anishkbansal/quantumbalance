import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <header className="py-4 px-6 bg-navy-800 border-b border-navy-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gold-500 text-2xl font-bold">Quantum Balance</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-navy-700 text-navy-300 rounded-lg hover:bg-navy-600 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-gold-500">Quantum</span> Frequency Healing
            </h1>
            <p className="text-xl text-navy-300 mb-12 max-w-3xl mx-auto">
              Harness the power of quantum frequencies to restore balance, 
              enhance wellness, and support your body's natural healing abilities.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition text-lg"
            >
              Start Your Healing Journey
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6 bg-navy-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-gold-500">How It Works</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-navy-750 p-6 rounded-lg border border-navy-700">
                <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-gold-500 text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gold-500">Complete Health Assessment</h3>
                <p className="text-navy-300">
                  Tell us about your health concerns, symptoms, and wellness goals through our comprehensive questionnaire.
                </p>
              </div>
              
              <div className="bg-navy-750 p-6 rounded-lg border border-navy-700">
                <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-gold-500 text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gold-500">Receive Custom Frequencies</h3>
                <p className="text-navy-300">
                  Our system generates personalized quantum healing frequencies specifically calibrated to your unique health profile.
                </p>
              </div>
              
              <div className="bg-navy-750 p-6 rounded-lg border border-navy-700">
                <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-gold-500 text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gold-500">Experience Transformation</h3>
                <p className="text-navy-300">
                  Listen to your prescribed frequencies daily and track your progress as your body restores balance and vitality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-gold-500">Success Stories</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                <p className="italic text-navy-300 mb-4">
                  "After just two weeks of following my personalized frequency prescription, 
                  my chronic headaches have reduced significantly and my energy levels have improved dramatically."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-navy-600 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-medium">Sarah J.</h4>
                    <p className="text-sm text-navy-400">Chronic Fatigue & Migraines</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                <p className="italic text-navy-300 mb-4">
                  "The immune support frequencies have been a game-changer for me. 
                  I've noticed fewer seasonal issues and feel more resilient overall. 
                  This is truly revolutionary healing."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-navy-600 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-medium">Michael T.</h4>
                    <p className="text-sm text-navy-400">Immune System Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-navy-800 border-t border-navy-700">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Begin Your Healing Journey?
            </h2>
            <p className="text-navy-300 mb-8">
              Take the first step toward enhanced wellness with personalized quantum frequency healing.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition text-lg"
            >
              Complete Health Assessment
            </button>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 bg-navy-850 border-t border-navy-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-gold-500 text-xl font-bold">Quantum Balance</span>
              <p className="text-navy-400 mt-2">Advanced quantum frequency healing solutions</p>
            </div>
            <div className="text-navy-400 text-sm">
              &copy; {new Date().getFullYear()} Quantum Balance. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 