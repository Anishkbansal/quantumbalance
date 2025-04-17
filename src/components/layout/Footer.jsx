import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-800 pt-8 sm:pt-16 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Legal</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/privacy-policy" className="text-navy-300 hover:text-gold-500 text-sm">Privacy Policy</Link></li>
              <li><Link to="/gdpr-policy" className="text-navy-300 hover:text-gold-500 text-sm">GDPR Compliance</Link></li>
              <li><Link to="/terms-of-service" className="text-navy-300 hover:text-gold-500 text-sm">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Support</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/faq" className="text-navy-300 hover:text-gold-500 text-sm">FAQ</Link></li>
              <li><Link to="/contact" className="text-navy-300 hover:text-gold-500 text-sm">Contact Us</Link></li>
            </ul>
          </div>
          <div className="sm:col-span-2 mt-6 sm:mt-0">
            <div className="flex items-start space-x-2 text-yellow-500">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-navy-300">
                Our frequency healing services are not intended to diagnose, treat, cure, or prevent any disease. 
                If you have a medical condition, please consult with your healthcare provider before starting any new wellness program.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-navy-700 pt-6 sm:pt-8">
          <p className="text-center text-navy-300 text-xs sm:text-sm">© {new Date().getFullYear()} Quantum Balance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 