import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-navy-300 hover:text-gold-500">Privacy Policy</Link></li>
              <li><Link to="/gdpr-policy" className="text-navy-300 hover:text-gold-500">GDPR Compliance</Link></li>
              <li><Link to="/terms-of-service" className="text-navy-300 hover:text-gold-500">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-navy-300 hover:text-gold-500">FAQ</Link></li>
              <li><Link to="/contact" className="text-navy-300 hover:text-gold-500">Contact Us</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-start space-x-2 text-yellow-500">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-1" />
              <p className="text-sm text-navy-300">
                Our frequency healing services are not intended to diagnose, treat, cure, or prevent any disease. 
                If you have a medical condition, please consult with your healthcare provider before starting any new wellness program.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-navy-700 pt-8">
          <p className="text-center text-navy-300">© 2025 Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 