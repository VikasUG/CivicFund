import React from 'react'

import { loader } from '../assets';
//small loader component to be displayed when transaction is in progress
const Loader = () => {
  return (
    <div className="fixed inset-0 z-[999] h-screen bg-[rgba(0,0,0,0.7)] flex items-center justify-center flex-col">
      <img src={loader} alt="loader" className="w-[100px] h-[100px] object-contain"/>
      <p className="mt-[20px] font-epilogue font-bold text-[20px] text-[var(--text-primary)] text-center">Transaction is in progress <br /> Please wait...</p>
    </div>
  );
};

export default Loader