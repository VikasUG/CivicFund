const safeNumber = (value) => {
  if (value == null) return NaN;
  const raw = typeof value === 'object' && value.toString ? value.toString() : value;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? NaN : parsed;
};

export const daysLeft = (deadline) => {
  const deadlineValue = safeNumber(deadline);

  if (Number.isNaN(deadlineValue) || deadlineValue <= 0) return 'N/A';

  const now = Date.now();
  const deadlineMs = deadlineValue * 1000;
  const timeLeft = deadlineMs - now;
  const days = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));

  return days;
};

export const formatEth = (value, decimals = 1) => {
  const raw = safeNumber(value);
  if (Number.isNaN(raw)) return (0).toFixed(decimals);
  return (raw / 1e18).toFixed(decimals);
};

export const parseEth = (value) => {
  const raw = safeNumber(value);
  if (Number.isNaN(raw)) return 0;
  return raw / 1e18;
};

export const calculateBarPercentage = (goal, raisedAmount) => {
  if (goal <= 0) return 0;
  const percentage = Math.round((raisedAmount * 100) / goal);
  return Math.min(Math.max(percentage, 0), 100);
};
  
  export const checkIfImage = (url, callback) => {
    const img = new Image();
    img.src = url;
  
    if (img.complete) callback(true);
  
    img.onload = () => callback(true);
    img.onerror = () => callback(false);
  };