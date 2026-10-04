import React from 'react'

const FormField = ({ labelName, placeholder, inputType, isTextArea, value, handleChange, children }) => {
  return (
    <label className="flex-1 w-full flex flex-col">
      {labelName && (
        <span className="font-epilogue font-medium text-[14px] leading-[22px] text-[var(--text-secondary)] mb-[10px]">{labelName}</span>
      )}
      {isTextArea ? (
        <textarea 
          required
          value={value}
          onChange={handleChange}
          rows={10}
          placeholder={placeholder}
          className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[var(--border-color)] bg-transparent font-epilogue text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-placeholder)] rounded-[10px] sm:min-w-[300px]"
        />
      ) : inputType === 'select' ? (
        <select 
          required
          value={value}
          onChange={handleChange}
          className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[var(--border-color)] bg-[var(--bg-secondary)] font-epilogue text-[var(--text-primary)] text-[14px] rounded-[10px] sm:min-w-[300px]"
        >
          {children}
        </select>
      ) : (
        <input 
          required
          value={value}
          onChange={handleChange}
          type={inputType}
          step="0.1"
          placeholder={placeholder}
          className="py-[15px] sm:px-[25px] px-[15px] outline-none border-[1px] border-[var(--border-color)] bg-transparent font-epilogue text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-placeholder)] rounded-[10px] sm:min-w-[300px]"
        />
      )}
    </label>
  )
}

export default FormField