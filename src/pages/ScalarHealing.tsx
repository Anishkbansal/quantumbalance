import React from 'react';
import { Zap, Waves, Brain, HeartPulse, Shield, BatteryCharging } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ScalarHealing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-6 text-center">
          <span className="text-gold-500">Scalar</span> Wave Healing
        </h1>
        <p className="text-lg text-navy-300 text-center max-w-3xl mx-auto">
          Experience the most advanced quantum healing technology: scalar wave therapy for profound healing at the cellular and energetic levels.
        </p>
      </div>
      
      {/* What Are Scalar Waves */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          <h2 className="text-2xl font-bold mb-6 text-gold-500">What Are Scalar Waves?</h2>
          <div className="text-navy-300 space-y-4">
            <p>
              Scalar waves are non-linear, non-Hertzian energy waves that exist outside the normal electromagnetic spectrum. 
              Unlike conventional electromagnetic waves, scalar waves do not diminish in strength with distance and can 
              penetrate any solid object without any loss of intensity.
            </p>
            <p>
              First described by James Clerk Maxwell in the 19th century and further developed by Nikola Tesla, scalar wave 
              technology represents the leading edge of quantum frequency healing.
            </p>
            <p>
              Our proprietary scalar wave technology generates precise, coherent energy fields that can interact with the 
              body's cells and biofield at the quantum level, promoting deep healing and energetic balance.
            </p>
          </div>
        </div>
      </div>
      
      {/* Benefits */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gold-500">Benefits of Scalar Wave Therapy</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <BatteryCharging className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cellular Regeneration</h3>
            <p className="text-navy-300">
              Enhances ATP production and cellular energy, accelerating the body's natural healing processes and tissue regeneration.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Immune Enhancement</h3>
            <p className="text-navy-300">
              Strengthens immune function by optimizing cellular communication and enhancing the activity of natural killer cells.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <Waves className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Stress Reduction</h3>
            <p className="text-navy-300">
              Balances the autonomic nervous system, reducing stress hormones and promoting deep relaxation.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mental Clarity</h3>
            <p className="text-navy-300">
              Enhances brain function, improving focus, memory, and cognitive performance while reducing brain fog.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <HeartPulse className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cardiovascular Support</h3>
            <p className="text-navy-300">
              Improves circulation and oxygen delivery while supporting healthy heart function and blood pressure.
            </p>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <div className="w-12 h-12 bg-navy-700 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pain Relief</h3>
            <p className="text-navy-300">
              Reduces inflammation and blocks pain signals, providing relief from acute and chronic pain conditions.
            </p>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gold-500">How Scalar Healing Works</h2>
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="h-64 bg-navy-700 rounded-lg"></div>
            </div>
            <div className="text-navy-300 space-y-4">
              <p>
                Our quantum scalar technology creates a powerful coherent energy field that resonates with your body's cells and biofield.
              </p>
              <p>
                Unlike traditional frequency devices that operate linearly, our scalar wave generator creates a multidimensional field that can:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Penetrate deeply into tissues without attenuation</li>
                <li>Carry information and healing frequencies</li>
                <li>Interact with cellular DNA and mitochondria</li>
                <li>Restore coherent communication between cells</li>
                <li>Support the body's innate healing intelligence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-gold-500">Client Experiences</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <p className="italic text-navy-300 mb-4">
              "After three sessions with the scalar wave therapy, my chronic fatigue improved dramatically. I've regained my energy and mental clarity for the first time in years."
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-navy-700 rounded-full mr-3"></div>
              <div>
                <h4 className="font-medium">Jennifer R.</h4>
                <p className="text-sm text-navy-400">Chronic Fatigue Syndrome</p>
              </div>
            </div>
          </div>
          
          <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
            <p className="italic text-navy-300 mb-4">
              "The scalar treatment has been life-changing for my autoimmune condition. My inflammation markers have decreased significantly, and I'm experiencing fewer flare-ups."
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-navy-700 rounded-full mr-3"></div>
              <div>
                <h4 className="font-medium">David M.</h4>
                <p className="text-sm text-navy-400">Autoimmune Condition</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-navy-800 rounded-lg p-8 shadow-lg border border-navy-700 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gold-500">Experience Scalar Healing</h2>
          <p className="text-navy-300 mb-6">
            Our personalized scalar wave prescriptions are custom-tailored to your specific health profile and wellness goals.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-gold-500 text-navy-900 font-medium rounded-lg hover:bg-gold-400 transition"
          >
            Start Your Healing Journey
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScalarHealing; 