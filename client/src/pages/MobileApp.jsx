import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PhoneFrame } from '../components/PhoneFrame';
import s from './MobileApp.module.css';

export default function MobileApp() {
  const navigate = useNavigate();

  return (
    <div className={s.shell}>
      <PhoneFrame src={`${window.location.origin}/`} />
      <button onClick={() => navigate('/')} className={s.back}>
        <ArrowLeft size={14} />
        Back to desktop
      </button>
    </div>
  );
}
