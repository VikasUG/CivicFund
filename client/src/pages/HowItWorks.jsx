import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      step: '1',
      title: 'Create or Back',
      text: 'Citizens launch civic campaigns and back them with escrowed funds, so money is secured until the work is verified.',
    },
    {
      step: '2',
      title: 'Contractor Fulfills',
      text: 'Registered contractors accept available jobs and complete the public infrastructure repair on site.',
    },
    {
      step: '3',
      title: 'Automated Payout',
      text: 'Image analysis confirms proof of completion, and escrowed funds are released as an instant payout.',
    },
  ];

  return (
    <section className="py-14">
      <div className="mx-auto max-w-[760px] text-center">
        <span className="mb-4 inline-block text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          How It Works
        </span>
        <h1 className="font-epilogue text-[30px] font-bold text-[var(--text-primary)] sm:text-[38px]">
          Trustless Civic Crowdfunding in Three Steps
        </h1>
        <p className="mt-4 font-epilogue text-[16px] leading-[1.7] text-[var(--text-secondary)]">
          CIVICFUND connects communities with verified contractors and pays out automatically
          once work is confirmed&mdash;no manual approvals required.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((item) => (
          <div
            key={item.step}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[15px] font-semibold text-white">
              {item.step}
            </div>
            <h3 className="font-epilogue text-[17px] font-semibold text-[var(--text-primary)]">
              {item.title}
            </h3>
            <p className="mt-2 font-epilogue text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;