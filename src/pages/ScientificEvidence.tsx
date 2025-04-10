import React from 'react';
import { FileText, Link2, ExternalLink, BookOpen, BarChart3, Microscope } from 'lucide-react';

const ScientificEvidence: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Scientific <span className="text-gold-500">Evidence</span>
        </h1>
        <p className="text-lg text-navy-300 text-center max-w-3xl mx-auto">
          Quantum frequency healing is supported by a growing body of scientific research. 
          Explore the evidence behind our approach to wellness.
        </p>
      </div>
      
      {/* Introduction */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          <h2 className="text-2xl font-bold mb-6 text-gold-500">The Science of Frequency Healing</h2>
          <div className="text-navy-300 space-y-4">
            <p>
              Every cell in your body emits and responds to specific electromagnetic frequencies. When these 
              frequencies become disrupted due to illness, stress, or environmental factors, health issues can arise.
            </p>
            <p>
              Quantum frequency healing works by delivering precise frequencies that help restore your body's natural 
              electromagnetic balance, supporting cellular repair and optimal function.
            </p>
            <p>
              Our approach is grounded in quantum physics, biofield science, and decades of clinical research on the 
              therapeutic effects of specific frequencies on biological systems.
            </p>
          </div>
        </div>
      </div>
      
      {/* Research Areas */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gold-500">Key Research Areas</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <Microscope className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cellular Response to Frequencies</h3>
            <p className="text-navy-300">
              Research demonstrating how specific electromagnetic frequencies affect cell membrane potential, 
              ATP production, and cellular regeneration.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Clinical Outcomes</h3>
            <p className="text-navy-300">
              Studies showing improved outcomes for pain reduction, inflammation, sleep quality, and stress 
              management through frequency therapy.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Quantum Biology</h3>
            <p className="text-navy-300">
              Emerging field exploring how quantum mechanical effects influence biological processes and healing.
            </p>
          </div>
        </div>
      </div>
      
      {/* Research Publications */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gold-500">Selected Research Publications</h2>
        <div className="bg-navy-800 rounded-lg shadow-lg border border-navy-700 overflow-hidden">
          <div className="space-y-6 divide-y divide-navy-700 p-6">
            <div className="pt-6 first:pt-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1">
                  <FileText className="h-5 w-5 text-gold-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">Frequency-Specific Microcurrent in Pain Management</h3>
                  <p className="text-sm text-navy-300 mt-1">
                    Journal of Bioelectricity, 2020
                  </p>
                  <p className="text-navy-300 mt-2">
                    A randomized controlled trial showing significant pain reduction using specific frequencies in patients with chronic musculoskeletal pain.
                  </p>
                  <button className="inline-flex items-center text-gold-500 hover:text-gold-400 mt-2 text-sm">
                    <span>View Abstract</span>
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1">
                  <FileText className="h-5 w-5 text-gold-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">Effects of Sound Frequencies on Cellular Repair Mechanisms</h3>
                  <p className="text-sm text-navy-300 mt-1">
                    International Journal of Healing Research, 2021
                  </p>
                  <p className="text-navy-300 mt-2">
                    An in vitro study demonstrating accelerated wound healing and cell regeneration when exposed to specific sound frequencies.
                  </p>
                  <button className="inline-flex items-center text-gold-500 hover:text-gold-400 mt-2 text-sm">
                    <span>View Abstract</span>
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-1">
                  <FileText className="h-5 w-5 text-gold-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">Quantum Coherence in Photosynthetic Complexes</h3>
                  <p className="text-sm text-navy-300 mt-1">
                    Nature Physics, 2019
                  </p>
                  <p className="text-navy-300 mt-2">
                    Evidence of quantum effects in biological systems, suggesting that quantum mechanisms may play a role in optimizing energy transfer efficiency.
                  </p>
                  <button className="inline-flex items-center text-gold-500 hover:text-gold-400 mt-2 text-sm">
                    <span>View Abstract</span>
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Research Partners */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-gold-500">Research Collaborations</h2>
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          <p className="text-navy-300 text-center mb-8">
            We partner with leading academic institutions and research centers to advance the scientific understanding of quantum frequency healing.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-navy-700 rounded-full flex items-center justify-center mb-2">
                <Link2 className="h-8 w-8 text-gold-500 opacity-50" />
              </div>
              <p className="text-white text-center">Quantum Medicine Research Institute</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-navy-700 rounded-full flex items-center justify-center mb-2">
                <Link2 className="h-8 w-8 text-gold-500 opacity-50" />
              </div>
              <p className="text-white text-center">Institute for Advanced Biofield Studies</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-navy-700 rounded-full flex items-center justify-center mb-2">
                <Link2 className="h-8 w-8 text-gold-500 opacity-50" />
              </div>
              <p className="text-white text-center">Center for Energy Medicine</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-navy-700 rounded-full flex items-center justify-center mb-2">
                <Link2 className="h-8 w-8 text-gold-500 opacity-50" />
              </div>
              <p className="text-white text-center">International Frequency Therapy Association</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScientificEvidence; 