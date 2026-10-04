import React from 'react'
//custom component for a small box to be displayed 3 times
const CountBox = ({ title, value }) => {
  return (
    <div className="flex flex-col items-center w-[150px]">
      <h4 className="font-epilogue font-bold text-[30px] text-[var(--text-primary)] p-3 bg-[var(--bg-secondary)] rounded-t-[10px] w-full text-center truncate">{value}</h4>
      <p className="font-epilogue font-normal text-[16px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-3 py-2 w-full rouned-b-[10px] text-center">{title}</p>
    </div>
  )
}

export default CountBox