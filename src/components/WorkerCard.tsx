import React from 'react';
import { Profile } from '../types';
import { MapPin, Star, ShieldCheck, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface WorkerCardProps {
  worker: Profile;
}

export default function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
            <img
              src={worker.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.fullName)}&background=random`}
              alt={worker.fullName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {worker.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-lg shadow-sm">
              <ShieldCheck size={12} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-0.5">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{worker.fullName}</h3>
            {worker.rating && worker.rating >= 4.5 && (
              <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">
                <Award size={10} className="mr-0.5" /> TOP
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-500 text-xs mb-2">
            <MapPin size={12} className="mr-1 text-gray-400" />
            {worker.region}{worker.district ? `, ${worker.district}` : ''}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-yellow-500">
              <Star size={14} fill="currentColor" />
              <span className="ml-1 text-sm font-bold text-gray-900">{worker.rating || 'Yangi'}</span>
              <span className="ml-1 text-xs text-gray-400">({worker.reviewCount || 0})</span>
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-bold text-blue-600">{worker.completedJobs || 0}</span> ta ish
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {worker.skills?.slice(0, 3).map((skill, idx) => (
          <span key={idx} className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {skill}
          </span>
        ))}
        {worker.skills && worker.skills.length > 3 && (
          <span className="text-[10px] font-medium text-gray-400 px-1 py-0.5">
            +{worker.skills.length - 3}
          </span>
        )}
      </div>

      <Link
        to={`/worker/${worker.uid}`}
        className="block w-full text-center bg-gray-50 text-gray-900 border border-gray-200 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors"
      >
        Profilni koʻrish
      </Link>
    </motion.div>
  );
}
