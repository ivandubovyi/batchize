import React, { useState } from "react";

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does Batchize actually do?",
      answer:
        "It gives you the whole YC application in one workspace, then checks every answer against what that specific question is really asking: buzzwords, hedging, missing metrics, unnamed competitors, weak founder-market fit, and contradictions between your answers. It also has a one-minute quick score, interview drills, a readiness score, and founder calculators.",
    },
    {
      question: "Do I need an API key or an account?",
      answer:
        "No, and not for any feature. Every part of the site, including the Partner coach, runs in your own browser with no sign-up, no key, no server and no network request. Nothing costs you anything and nothing can be rate-limited.",
    },
    {
      question: "Is my application data uploaded anywhere?",
      answer:
        "Nothing you type ever leaves your machine. There is no server and no account: your application is saved only in this browser, on this device. That also means clearing your browser data will delete it, and it will not follow you to another computer.",
    },
    {
      question: "How is this different from just proofreading it myself?",
      answer:
        "It reads the application the way a partner does: cross-referencing. It catches a user count in one answer that contradicts another, a sentence pasted into two answers, revenue claimed with no users, and a one-liner that shares no words with your product description. Those are the mistakes that are invisible when you read each answer on its own.",
    },
    {
      question: "Can YC partners detect it?",
      answer:
        "Your writing stays yours. The reviewer never writes answers for you. It scores what you wrote and points at weaknesses, the way a blunt friend would. You remain the author of your story.",
    },
    {
      question: "What if I think my application is already good?",
      answer:
        "That is exactly when a check is cheapest. The dangerous mistakes are the invisible ones: a one-liner over 50 characters, a traction answer with zero numbers, an idea story that never mentions why you specifically. Run it once and see what gets flagged.",
    },
    {
      question: "How do I get started?",
      answer:
        "Hit 'I'm Ready' to open the app. If you only have a minute, start with the Quick score: eleven short questions and no essays. Otherwise go straight to the Application tab and start writing.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-center gap-8 px-4 md:px-0">
      <img
        className="max-w-sm w-full rounded-xl h-auto"
        src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=830&h=844&auto=format&fit=crop"
        alt="Workspace"
      />
      <div>
        <p className="text-primary text-sm font-medium">FAQ's</p>
        <h1 className="text-3xl font-semibold text-foreground">Looking for answers?</h1>
        <p className="text-sm text-muted-foreground mt-2 pb-4">
          Everything you might want to know before you paste your application
          in.
        </p>
        {faqs.map((faq, index) => (
          <div
            className="border-b border-border py-4 cursor-pointer"
            key={index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">{faq.question}</h3>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${
                  openIndex === index ? "rotate-180" : ""
                } transition-all duration-500 ease-in-out shrink-0 text-foreground`}
              >
                <path
                  d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p
              className={`text-sm text-muted-foreground transition-all duration-500 ease-in-out max-w-md ${
                openIndex === index
                  ? "opacity-100 max-h-[300px] translate-y-0 pt-4"
                  : "opacity-0 max-h-0 -translate-y-2 overflow-hidden"
              }`}
            >
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqSection;
