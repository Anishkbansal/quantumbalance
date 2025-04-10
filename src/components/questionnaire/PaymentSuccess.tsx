import React from 'react';
import { Check } from 'lucide-react';

interface PaymentSuccessProps {
  packageName: string;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ packageName }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-gold-500 rounded-full flex items-center justify-center shadow-lg shadow-gold-500/20">
        <Check className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-white">Payment Successful!</h2>
      
      <p className="text-xl text-gray-300 max-w-md">
        Thank you for choosing the <span className="text-gold-500 font-semibold">{packageName}</span> package. 
        Your payment has been received.
      </p>
      
      <p className="text-gray-400 max-w-md">
        Your customized frequency prescriptions are being prepared and will be available on your dashboard shortly.
      </p>
      
      <div className="mt-4 text-sm text-gray-500">
        You will be redirected to your dashboard automatically...
      </div>
    </div>
  );
};

export default PaymentSuccess; 