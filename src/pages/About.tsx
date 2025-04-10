import React from 'react';
import { Award, Users, Heart, BookOpen, ShieldCheck, Lightbulb, ArrowLeft, Cpu, Link, Target } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-indigo-400 hover:text-indigo-300">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
          <div className="flex items-center">
            <Cpu className="h-8 w-8 text-indigo-500" />
            <span className="ml-2 text-xl font-bold text-white">Quantum Balance</span>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-12">
          <h1 className="text-3xl font-bold text-white mb-6">About Quantum Balance</h1>
          <p className="text-gray-300 leading-relaxed mb-8">
            At Quantum Balance, we believe in the power of frequencies to heal, restore, and harmonize the body. Although many are new to frequency healing, scientific research and renowned experts support the understanding that frequencies have a profound influence on human health. Our global platform is led by a licensed acupuncturist (MCA, Govt. of India) with a Doctorate in Neuroscience and a Doctorate in Acupuncture, ensuring that our approach is grounded in scientific principles, clinical expertise, and integrative healing methods. By bridging neuroscience, bioelectromagnetics, and vibrational medicine, we aim to advance frequency-based wellness therapies with both scientific integrity and practical application.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-700/50 rounded-xl p-6">
              <Target className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Our Mission</h3>
              <p className="text-gray-300">To provide accessible, non-invasive healing solutions through advanced healing frequency technology, empowering individuals to take control of their health naturally.</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6">
              <Lightbulb className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Our Approach</h3>
              <p className="text-gray-300">We believe in holistic healing that works in harmony with your body's natural processes. Our sonic prescriptions are designed to support and enhance your body's innate healing abilities.</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6">
              <Cpu className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">The Technology</h3>
              <p className="text-gray-300">Our platform utilizes advanced frequency healing technology to generate precisely calibrated frequency patterns designed to support various health concerns.</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6">
              <Heart className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Our Commitment</h3>
              <p className="text-gray-300">We are committed to delivering high-quality frequency healing solutions while upholding strict ethical standards and transparency in our practices.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 