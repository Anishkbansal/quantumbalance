import React from 'react';
import { ArrowLeft, AudioWaveform as Waveform, Brain, FlaskRound as Flask, Microscope, Dna, Zap, Activity, Clock, Speaker, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScientificEvidence() {
  const programDetails = [
    {
      title: 'Duration & Usage',
      icon: Clock,
      items: [
        'Sessions vary between 10 to 60 minutes',
        'Recommended twice daily for maximum benefits',
        'Best used in a relaxed environment'
      ]
    },
    {
      title: 'Delivery Method',
      icon: Speaker,
      items: [
        'Over-ear headphones covering the ears for general wellbeing',
        'Localized Healing: Place Bluetooth speaker near affected area',
        'Hydration recommended during sessions'
      ]
    },
    {
      title: 'Custom Add-On Programmes',
      icon: UserPlus,
      items: [
        'Personalised for Each User – Based on your questionnaire responses',
        'Immediate Access to General Programmes (Stress, Sleep, Detox)',
        'Custom add-ons appear in your dashboard once created',
        'Non-Transferable – Designed specifically for individual needs'
      ]
    }
  ];

  const clinicalObservations = [
    {
      title: 'Stress reduction and relaxation',
      description: 'Schumann Resonance studies on brainwave entrainment',
      icon: Brain
    },
    {
      title: 'Pain management and relief',
      description: 'PEMF research on nerve stimulation and inflammation',
      icon: Activity
    },
    {
      title: 'Energy balance and vitality',
      description: 'Low-frequency EMF studies on mitochondrial ATP production',
      icon: Zap
    },
    {
      title: 'Sleep improvement',
      description: 'Bioresonance effects on circadian rhythm regulation',
      icon: Activity
    },
    {
      title: 'Immune system support',
      description: 'Studies on frequency-induced calcium signaling and immune modulation',
      icon: Flask
    },
    {
      title: 'Cellular detoxification',
      description: 'Research on vibrational resonance and toxin clearance in biological tissues',
      icon: Microscope
    }
  ];

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

        {/* Introduction */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h1 className="text-3xl font-bold text-white mb-6">What Are Frequency Healing Sonic Prescriptions?</h1>
          <div className="text-navy-300 space-y-6">
            <p className="leading-relaxed">
              Frequency Healing Sonic Prescriptions utilize Rife frequency technology to deliver targeted therapeutic effects through sound. 
              Rooted in the pioneering research of Dr. Royal Raymond Rife, this approach is based on the principle of resonance, where 
              specific frequencies interact with biological systems to support balance and well-being.
            </p>
            <p className="leading-relaxed">
              This non-invasive modality is designed to influence physical, emotional, and energetic states by using carefully calibrated 
              sound frequencies to promote cellular harmony, bioelectrical balance, and overall vitality.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="text-navy-300 space-y-6">
            <p className="leading-relaxed">
              Every cell, pathogen, or imbalance has a unique resonant frequency. By delivering precise frequencies via audio, 
              harmful organisms (like viruses) are neutralized, while healthy cells remain unaffected—much like how a singer 
              shatters a wine glass using its resonant frequency.
            </p>
            <p className="leading-relaxed">
              Sound travels five times more efficiently in water, making it ideal for the human body, which is composed of 
              approximately 60% water. Resonant frequencies enhance frequency delivery, bypassing traditional electromagnetic 
              limitations to achieve deeper cellular interaction and bioenergetic balance.
            </p>
          </div>
        </div>

        {/* Cellular Function */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Sonic Frequency Effects on Cellular Function</h2>
          <p className="text-navy-300 leading-relaxed mb-6">
            Recent studies have shown that sonic frequency healing, including Rife and bioresonance frequencies, can influence cellular membrane potential and ATP production. Research in bioelectromagnetics and vibrational medicine provides evidence for the observed effects of frequency-based therapies on biological systems, particularly in areas of:
          </p>
          <ul className="space-y-4 text-navy-300">
            <li className="flex items-center">
              <Dna className="h-5 w-5 text-gold-400 mr-3" />
              Cellular energy production (Goodman et al., 1995; Bioelectromagnetics, 2010)
            </li>
            <li className="flex items-center">
              <Dna className="h-5 w-5 text-gold-400 mr-3" />
              Membrane function optimization (Electromagnetic Biology and Medicine, 2015)
            </li>
            <li className="flex items-center">
              <Dna className="h-5 w-5 text-gold-400 mr-3" />
              Intracellular communication (Nature Scientific Reports, 2018)
            </li>
            <li className="flex items-center">
              <Dna className="h-5 w-5 text-gold-400 mr-3" />
              Biological coherence (Fröhlich, 1968; Becker & Marino, 1982)
            </li>
          </ul>
        </div>

        {/* Clinical Observations */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">Clinical Observations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinicalObservations.map((observation, index) => (
              <div key={index} className="bg-navy-700/50 rounded-xl p-6">
                <observation.icon className="h-8 w-8 text-gold-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{observation.title}</h3>
                <p className="text-navy-300">{observation.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Principles */}
        <div className="bg-navy-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Scientific Principles</h2>
          <p className="text-navy-300 leading-relaxed mb-6">
            Our programs are grounded in cutting-edge frequency modulation techniques, drawing from:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-navy-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Quantum Physics and Field Theory</h3>
              <p className="text-navy-300">Fröhlich, 1968; Becker, 1990</p>
            </div>
            <div className="bg-navy-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Neurological Frequency Response Patterns</h3>
              <p className="text-navy-300">Electromagnetic neuromodulation and brainwave entrainment studies</p>
            </div>
            <div className="bg-navy-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Bioenergetic Medicine Research</h3>
              <p className="text-navy-300">Studies on electromagnetic fields and biological resonance</p>
            </div>
            <div className="bg-navy-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Advanced Vibrational Healing Technology</h3>
              <p className="text-navy-300">Bioresonance therapy, PEMF, and Rife frequency research</p>
            </div>
          </div>
        </div>

        {/* Programme Details */}
        <div className="bg-navy-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8">Programme Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programDetails.map((section, index) => (
              <div key={index} className="bg-navy-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="h-6 w-6 text-gold-400" />
                  <h3 className="text-lg font-medium text-white">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="text-gold-400 mr-2">•</span>
                      <span className="text-navy-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 