import React from 'react';
import { Input } from '../ui/FormElements';

interface UserInfoFormProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  phone: string;
  setPhone: (phone: string) => void;
  isEditing: boolean;
}

export default function UserInfoForm({
  name,
  setName,
  email,
  phone,
  setPhone,
  isEditing
}: UserInfoFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-navy-300 mb-2">Name</label>
        {isEditing ? (
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:border-gold-500 focus:outline-none"
          />
        ) : (
          <p className="text-white">{name}</p>
        )}
      </div>
      
      <div>
        <label className="block text-navy-300 mb-2">Email</label>
        <p className="text-white">{email}</p>
        <p className="text-navy-400 text-sm mt-1">
          Email cannot be changed
        </p>
      </div>
      
      <div>
        <label className="block text-navy-300 mb-2">Phone</label>
        {isEditing ? (
          <input
            type="text"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-md text-white focus:border-gold-500 focus:outline-none"
          />
        ) : (
          <p className="text-white">{phone || 'Not provided'}</p>
        )}
      </div>
    </div>
  );
} 