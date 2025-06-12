import React from 'react';

const Loader = () => {
  return (
    <div className="loader-wrapper">
      <div className="loader-circles">
        <div className="circle delay-0" />
        <div className="circle delay-1" />
        <div className="circle delay-2" />
      </div>
      <div className="text-white text-sm md:text-base uppercase mt-4 font-medium font-barlow">Delta Neutral</div>
    </div>
  );
};

export default Loader;
